const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/authMiddleware");

// 所有卡片相关的操作都需要先登录
router.use(auth);

router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
            SELECT c.* FROM cards c
            JOIN lists l ON c.list_id = l.id
            JOIN boards b ON l.board_id = b.id
            WHERE b.user_id = $1
            ORDER BY c.id;
        `;

    const result = await db.query(query, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("服务器错误");
  }
});

router.put("/update-order", auth, async (req, res) => {

  console.log("完整的请求对象:", req); // <--- 增加这一行！
  // 1. 从请求体中解构出 cards 数组
  const { cards } = req.body;
  // 2. 从 auth 中间件中获取当前登录用户的 ID
  const userId = req.user.id;

  // 3. 基本的验证，确保前端发送了正确的数据
  if (!Array.isArray(cards) || cards.length === 0) {
    return res.status(400).json({ msg: "请求体需要一个包含卡片信息的数组" });
  }

  // 4. 从数据库连接池中获取一个客户端，用于执行事务
  const client = await db.pool.connect(); // 假设你的 db.js 导出了 pool

  try {
    // 5. 开始一个数据库事务
    await client.query("BEGIN");

    // 6. 安全性检查：一次性验证所有要被更新的卡片都属于当前用户
    // 这是为了防止恶意用户通过 API 更新不属于他的卡片
    const cardIds = cards.map((c) => c.id);
    const authQuery = `
            SELECT c.id FROM cards c
            JOIN lists l ON c.list_id = l.id
            JOIN boards b ON l.board_id = b.id
            WHERE b.user_id = $1 AND c.id = ANY($2::int[])
        `;
    const authResult = await client.query(authQuery, [userId, cardIds]);

    // 如果数据库中找到的、属于该用户的卡片数量，和前端传来的不一致，说明有权限问题
    if (authResult.rowCount !== cardIds.length) {
      // 在抛出错误前，先回滚事务，这是一个好习惯
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ msg: "权限错误：你正试图修改不属于你的卡片" });
    }

    // 7. 遍历前端传来的每一张卡片信息，并执行更新
    for (const card of cards) {
      const updateQuery = `
                UPDATE cards 
                SET "order" = $1, list_id = $2 
                WHERE id = $3
            `;
      // 在事务中执行更新
      await client.query(updateQuery, [card.order, card.list_id, card.id]);
    }

    // 8. 如果所有更新都成功了，就提交事务，让所有更改永久生效
    await client.query("COMMIT");

    // 9. 向前端发送一个成功的响应
    res.json({ msg: "卡片顺序已成功更新" });
  } catch (err) {
    // 10. 如果在 try 代码块中的任何地方发生了错误，就回滚事务
    // 这会撤销所有已经执行但尚未提交的更新，保证数据的一致性
    await client.query("ROLLBACK");

    console.error("更新卡片顺序时出错:", err.message);

    // 11. 向前端发送一个服务器错误的响应
    res.status(500).json({ msg: "服务器内部错误", error: err.message });
  } finally {
    // 12. 无论成功还是失败，最后都必须释放数据库客户端连接
    // 把它还给连接池，以便其他请求可以使用
    client.release();
  }
});

// 作用：获取单个卡片的详细信息
router.get("/:id", async (req, res) => {
  const cardId = req.params.id;
  const userId = req.user.id;

  try {
    // 权限验证：确保这张卡片属于当前登录的用户
    // 我们通过查询卡片 -> 列表 -> 看板 -> 用户的链条来验证
    const query = `
           SELECT 
                c.*, -- 选择卡片的所有字段
                -- 使用 COALESCE 和 JSON_AGG 来聚合附件
                -- 如果没有附件，JSON_AGG 会返回 NULL，COALESCE 会把它转换成一个空数组 '[]'
                COALESCE(
                    (SELECT JSON_AGG(att.* ORDER BY att.uploaded_at) 
                     FROM attachments att 
                     WHERE att.card_id = c.id),
                    '[]'::json
                ) as attachments,
                -- 同样聚合标签
                COALESCE(
                    (SELECT JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', t.id,
                            'name', t.name,
                            'color', t.color
                        ) ORDER BY t.name
                    ) 
                     FROM tags t 
                     JOIN card_tags ct ON t.id = ct.tag_id
                     WHERE ct.card_id = c.id),
                    '[]'::json
                ) as tags
            FROM cards c
            -- 嵌套查询用于权限验证
            WHERE c.id = $1 AND c.list_id IN (
                SELECT l.id FROM lists l
                JOIN boards b ON l.board_id = b.id
                WHERE b.user_id = $2
            )
        `;
    const result = await db.query(query, [cardId, userId]);

    // if (result.rows.length === 0) {
    //   return res.status(403).json({ msg: "无权访问此卡片或卡片不存在" });
    // }
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: "卡片未找到或无权访问" });
    }

    res.json(result.rows[0]); // 返回找到的卡片详情
  } catch (err) {
    // console.error(`获取卡片 ${cardId} 详情时出错:`, err);
    // res.status(500).json({ error: "服务器内部错误" });
    console.error("获取卡片详情时出错:", err.message);
    res.status(500).send("服务器错误");
  }
});

router.put("/:id", auth, async (req, res) => {

  const cardId = req.params.id;
  const userId = req.user.id;

  // 从请求体中解构出所有前端可能发送的字段
  const { title, description, priority, status, due_date } = req.body;

  try {
    // 1. 权限验证 (这个逻辑是正确的，保持不变)
    const authQuery = `
      SELECT c.id FROM cards c
      JOIN lists l ON c.list_id = l.id
      JOIN boards b ON l.board_id = b.id
      WHERE c.id = $1 AND b.user_id = $2
    `;
    const authResult = await db.query(authQuery, [cardId, userId]);

    if (authResult.rows.length === 0) {
      return res.status(403).json({ msg: "无权更新此卡片或卡片不存在" });
    }

    // 2. 构建动态更新查询语句 (这是重写的核心)
    const updates = [];
    const values = [];
    let queryIndex = 1;

    // 检查每个字段，如果前端传了，就把它加到更新队列里
    if (title !== undefined) {
      updates.push(`title = $${queryIndex++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${queryIndex++}`);
      values.push(description);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${queryIndex++}`);
      values.push(priority);
    }
    if (status !== undefined) {
      updates.push(`status = $${queryIndex++}`);
      values.push(status);
    }
    // 对于日期，如果前端传了空字符串，我们应该存为 NULL
    if (due_date !== undefined) {
      updates.push(`due_date = $${queryIndex++}`);
      values.push(due_date || null); // 如果是空字符串，转为 null
    }

    // 如果一个要更新的字段都没有，就没必要执行查询了
    if (updates.length === 0) {
      // 这种情况可以返回成功，因为“什么都不更新”也算一种成功的操作
      return res.status(200).json({ msg: "没有需要更新的字段" });
    }

    // 3. 执行更新
    values.push(cardId); // 把 WHERE 条件的 cardId 加到最后
    const updateQuery = `
      UPDATE cards 
      SET ${updates.join(", ")} 
      WHERE id = $${queryIndex} 
      RETURNING *
    `;

    const updatedCardResult = await db.query(updateQuery, values);

    // 4. 获取更新后的完整卡片数据，包括附件和标签
    const cardWithAttachmentsQuery = `
      SELECT 
        c.*, -- 选择卡片的所有字段
        COALESCE(
          (SELECT JSON_AGG(att.* ORDER BY att.uploaded_at) 
           FROM attachments att 
           WHERE att.card_id = c.id),
          '[]'::json
        ) as attachments,
        COALESCE(
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', t.id,
              'name', t.name,
              'color', t.color
            ) ORDER BY t.name
          ) 
           FROM tags t 
           JOIN card_tags ct ON t.id = ct.tag_id
           WHERE ct.card_id = c.id),
          '[]'::json
        ) as tags
      FROM cards c
      WHERE c.id = $1
    `;

    const cardWithAttachments = await db.query(cardWithAttachmentsQuery, [
      cardId,
    ]);

    // 5. 返回更新后的完整卡片数据（包含附件）
    res.json(cardWithAttachments.rows[0]);
  } catch (err) {
    console.error(`更新卡片 ${cardId} 时出错:`, err);
    res.status(500).json({ error: "服务器内部错误", details: err.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const cardId = req.params.id;
    const userId = req.user.id;

    // 安全性检查：在删除前，必须验证这张卡片是否属于当前登录的用户
    // 我们通过一个复杂的查询来确保这一点：
    // 检查要删除的卡片(id=$1)，它所属的列表的看板，是否属于当前用户(user_id=$2)
    const deleteQuery = `
            DELETE FROM cards
            WHERE id = $1 AND list_id IN (
                SELECT l.id FROM lists l
                JOIN boards b ON l.board_id = b.id
                WHERE b.user_id = $2
            )
        `;

    const result = await db.query(deleteQuery, [cardId, userId]);

    // 如果 result.rowCount 是 0，意味着没有卡片被删除。
    // 这可能是因为卡片ID不存在，或者用户无权删除它。
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: "卡片未找到或无权删除" });
    }

    // HTTP 204 No Content 是 DELETE 成功但不需要返回任何内容的标准响应
    // 但为了前端方便，返回一个成功的消息也很好
    res.json({ msg: "卡片已成功删除" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("服务器错误");
  }
});

module.exports = router;
