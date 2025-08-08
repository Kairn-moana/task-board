const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/authMiddleware"); // 引入认证中间件

// 所有在此文件中的路由都需要先通过 auth 中间件的验证
router.use(auth);

// GET /api/boards - 获取当前登录用户的所有看板列表
router.get("/", async (req, res) => {
  try {
    // 从 auth 中间件获取当前登录用户的 ID
    const userId = req.user.id;

    console.log(`[boards.js] 正在为用户 ${userId} 获取看板列表...`); // 调试日志

    const result = await db.query(
      "SELECT * FROM boards WHERE user_id = $1 ORDER BY id ASC",
      [userId]
    );

    console.log(
      `[boards.js] 为用户 ${userId} 找到了 ${result.rowCount} 个看板。`
    ); // 调试日志

    res.json(result.rows);
  } catch (err) {
    console.error("[boards.js] 获取看板列表时后端出错:", err); // 打印完整错误
    res.status(500).json({ error: "服务器内部错误" });
  }
});

// POST /api/boards - 为当前用户创建一个新看板
router.post("/", async (req, res) => {
  const { title } = req.body;
  const userId = req.user.id;

  if (!title) {
    return res.status(400).json({ msg: "看板标题不能为空" });
  }

  try {
    const newBoard = await db.query(
      "INSERT INTO boards (title, user_id) VALUES ($1, $2) RETURNING *",
      [title, userId]
    );

    res.status(201).json(newBoard.rows[0]);
  } catch (err) {
    console.error("[boards.js] 创建看板时后端出错:", err);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

// GET /api/boards/:id - 获取单个看板的详细数据 (包含列表和卡片)
router.get("/:id", async (req, res) => {
  const boardId = req.params.id;
  const userId = req.user.id;

  try {
    // 1. 验证用户是否有权访问此看板
    const boardAuth = await db.query(
      "SELECT id FROM boards WHERE id = $1 AND user_id = $2",
      [boardId, userId]
    );
    if (boardAuth.rows.length === 0) {
      return res.status(403).json({ msg: "无权访问此看板" });
    }

    // 2. 获取该看板下的所有列表
    const listsResult = await db.query(
      'SELECT * FROM lists WHERE board_id = $1 ORDER BY "order" ASC',
      [boardId]
    );
    const lists = listsResult.rows;

    // 3. 获取该看板下的所有卡片，包括附件和标签
    const cardsResult = await db.query(
      `SELECT 
        c.*,
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
       JOIN lists l ON c.list_id = l.id
       WHERE l.board_id = $1 ORDER BY c."order" ASC`,
      [boardId]
    );
    const cards = cardsResult.rows;

    // 4. 将卡片数据组合到对应的列表中 (这是关键！)
    const boardDetailData = lists.map((list) => {
      return {
        ...list, // 包含列表的所有信息 (id, title, order, board_id)
        cards: cards.filter((card) => card.list_id === list.id), // 找出所有属于这个列表的卡片
      };
    });

    // 5. 将组合好的完整数据返回给前端
    res.json(boardDetailData);
  } catch (err) {
    console.error(`[boards.js] 获取看板 ${boardId} 详情时出错:`, err);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

// POST /api/boards/:boardId/lists - 在指定看板下创建一个新列表
router.post("/:boardId/lists", async (req, res) => {
  const { boardId } = req.params;
  const { title } = req.body;
  const userId = req.user.id;

  if (!title) {
    return res.status(400).json({ msg: "列表标题不能为空" });
  }

  try {
    // 1. 验证用户是否有权访问此看板
    const boardAuth = await db.query(
      "SELECT id FROM boards WHERE id = $1 AND user_id = $2",
      [boardId, userId]
    );
    if (boardAuth.rows.length === 0) {
      return res.status(403).json({ msg: "无权在此看板下创建列表" });
    }

    // 2. 计算新列表的 order
    const orderResult = await db.query(
      "SELECT COUNT(*) FROM lists WHERE board_id = $1",
      [boardId]
    );
    const newOrder = parseInt(orderResult.rows[0].count);

    // 3. 创建新列表
    const newListResult = await db.query(
      'INSERT INTO lists (title, "order", board_id) VALUES ($1, $2, $3) RETURNING *',
      [title, newOrder, boardId]
    );

    res.status(201).json(newListResult.rows[0]);
  } catch (err) {
    console.error("[boards.js] 创建列表时后端出错:", err);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

// POST /api/boards - 为当前用户创建一个新看板
router.post("/", async (req, res) => {
  const { title } = req.body;
  const userId = req.user.id;

  if (!title) {
    return res.status(400).json({ msg: "看板标题不能为空" });
  }

  // 使用数据库客户端进行事务处理
  const client = await db.getClient(); // 从连接池获取一个客户端

  try {
    await client.query("BEGIN"); // 开始事务

    // 1. 创建新看板
    const newBoardResult = await client.query(
      "INSERT INTO boards (title, user_id) VALUES ($1, $2) RETURNING *",
      [title, userId]
    );
    const newBoard = newBoardResult.rows[0];

    // 2. 为新看板创建默认列表
    const defaultLists = [
      { title: "待办事项", order: 0 },
      { title: "进行中", order: 1 },
      { title: "已完成", order: 2 },
    ];

    for (const list of defaultLists) {
      await client.query(
        'INSERT INTO lists (title, "order", board_id) VALUES ($1, $2, $3)',
        [list.title, list.order, newBoard.id]
      );
    }

    await client.query("COMMIT"); // 提交事务

    res.status(201).json(newBoard);
  } catch (err) {
    await client.query("ROLLBACK"); // 如果出错，回滚事务
    console.error("[boards.js] 创建看板时后端出错:", err);
    res.status(500).json({ error: "服务器内部错误" });
  } finally {
    client.release(); // 将客户端释放回连接池
  }
});

router.post("/:boardId/lists/:listId/cards", async (req, res) => {
  const { listId } = req.params;
  const { title } = req.body;
  const userId = req.user.id;

  if (!title) {
    return res.status(400).json({ msg: "卡片标题不能为空" });
  }

  try {
    // 权限验证：确保用户有权操作这个列表（通过其所属的看板来验证）
    const listAuth = await db.query(
      `SELECT l.id FROM lists l JOIN boards b ON l.board_id = b.id
             WHERE l.id = $1 AND b.user_id = $2`,
      [listId, userId]
    );
    if (listAuth.rows.length === 0) {
      return res.status(403).json({ msg: "无权在此列表下创建卡片" });
    }

    // 计算新卡片的 order
    const orderResult = await db.query(
      "SELECT COUNT(*) FROM cards WHERE list_id = $1",
      [listId]
    );
    const newOrder = parseInt(orderResult.rows[0].count);

    // 创建新卡片
    const newCardResult = await db.query(
      'INSERT INTO cards (title, "order", list_id) VALUES ($1, $2, $3) RETURNING *',
      [title, newOrder, listId]
    );

    res.status(201).json(newCardResult.rows[0]);
  } catch (err) {
    console.error("[boards.js] 创建卡片时后端出错:", err);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

// PUT /api/board/:boardId/cards/move - 移动指定看板下的卡片并更新顺序
router.put("/:boardId/cards/move", async (req, res) => {
  const { boardId } = req.params;
  const { cardId, newListId, newOrder } = req.body;
  const userId = req.user.id;

  try {
    // 1. 验证用户是否有权访问此看板
    if (!(await hasBoardAccess(userId, boardId))) {
      return res.status(403).json({ msg: "无权在此看板下移动卡片" });
    }

    // 2. 验证 cardId 和 newListId 确实属于此看板
    const cardCheck = await db.query(
      `SELECT 1 FROM cards c
      JOIN lists l ON c.list_id = l.id
      WHERE c.id = $1 AND l.board_id = $2`,
      [cardId, boardId]
    );
    const newListCheck = await db.query(
      "SELECT * FROM lists WHERE id = $1 AND board_id = $2",
      [newListId, boardId]
    );

    if (cardCheck.rows.length === 0 || newListCheck.rows.length === 0) {
      return res.status(400).json({ msg: "cardId 或 newListId 不属于此看板" });
    }

    // 3. 更新卡片
    const result = await db.query(
      'UPDATE cards SET list_id = $1, "order" = $2 WHERE id = $3 RETURNING *',
      [newListId, newOrder, cardId]
    );

    if (result.rowCount === 0) {
      return res.status(404).send("Card not found");
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/board/:boardId/cards/:id - 获取指定看板下的单个卡片的详细信息
router.get("/:boardId/cards/:id", async (req, res) => {
  const { boardId, id } = req.params;
  const userId = req.user.id;

  try {
    // 1. 验证用户是否有权访问此看板
    if (!(await hasBoardAccess(userId, boardId))) {
      return res.status(403).json({ msg: "无权访问此看板" });
    }

    // 2. 验证用户是否对指定卡片有权限
    if (!(await hasCardAccess(userId, id))) {
      return res.status(403).json({ msg: "无权访问此卡片" });
    }

    // 3. 获取卡片信息
    const result = await db.query(
      `SELECT c.* FROM cards c
      JOIN lists l ON c.list_id = l.id
      WHERE c.id = $1 AND l.board_id = $2`,
      [id, boardId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "卡片未找到" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("服务器错误");
  }
});

// PUT /api/board/:boardId/cards/:id - 更新指定看板下的卡片的标题或描述
router.put("/:boardId/cards/:id", async (req, res) => {
  const { boardId, id } = req.params;
  const { title, description } = req.body;
  const userId = req.user.id;

  try {
    // 1. 验证用户是否有权访问此看板
    if (!(await hasBoardAccess(userId, boardId))) {
      return res.status(403).json({ msg: "无权修改此看板下的卡片" });
    }

    // 2. 验证用户是否对指定卡片有权限
    if (!(await hasCardAccess(userId, id))) {
      return res.status(403).json({ msg: "无权访问此卡片" });
    }

    // 3. 更新卡片
    const result = await db.query(
      `UPDATE cards SET title = $1, description = $2
      WHERE id = $3 AND list_id IN (SELECT id FROM lists WHERE board_id = $4)
      RETURNING *`,
      [title, description, id, boardId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ msg: "卡片未找到" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("服务器错误");
  }
});

router.post("/:boardId/lists", auth, async (req, res) => {
  const { title } = req.body;
  const { boardId } = req.params;
  const userId = req.user.id;

  try {
    // 安全性检查：确认这个看板是属于当前用户的
    const boardCheck = await db.query(
      "SELECT id FROM boards WHERE id = $1 AND user_id = $2",
      [boardId, userId]
    );
    if (boardCheck.rowCount === 0) {
      return res.status(403).json({ msg: "无权在此看板下创建列表" });
    }

    // 计算新列表的 order
    const orderResult = await db.query(
      "SELECT COUNT(*) FROM lists WHERE board_id = $1",
      [boardId]
    );
    const newOrder = parseInt(orderResult.rows[0].count);

    const newList = await db.query(
      'INSERT INTO lists (title, board_id, "order") VALUES ($1, $2, $3) RETURNING *',
      [title, boardId, newOrder]
    );

    res.status(201).json(newList.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("服务器错误");
  }
});

// 帮助函数：验证用户是否对指定看板有权限
async function hasBoardAccess(userId, boardId) {
  const boardAuth = await db.query(
    "SELECT * FROM boards WHERE id = $1 AND user_id = $2",
    [boardId, userId]
  );
  return boardAuth.rows.length > 0;
}

// 帮助函数：验证用户是否对指定列表有权限
async function hasListAccess(userId, listId) {
  const listAuth = await db.query(
    `SELECT 1 FROM lists l
    JOIN boards b ON l.board_id = b.id
    WHERE l.id = $1 AND b.user_id = $2`,
    [listId, userId]
  );
  return listAuth.rows.length > 0;
}

// 帮助函数：验证用户是否对指定卡片有权限
async function hasCardAccess(userId, cardId) {
  const cardAuth = await db.query(
    `SELECT 1 FROM cards c
    JOIN lists l ON c.list_id = l.id
    JOIN boards b ON l.board_id = b.id
    WHERE c.id = $1 AND b.user_id = $2`,
    [cardId, userId]
  );
  return cardAuth.rows.length > 0;
}

module.exports = router;
