const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/authMiddleware");

// 所有急救包相关操作都需要登录
router.use(auth);

/**
 * @route   POST /api/emergency-kit/items
 * @desc    创建一个新的急救包条目
 * @access  Private
 */
router.post("/items", async (req, res) => {
  const userId = req.user.id;
  const { title, category, estimated_duration_minutes, steps, requires_tools } =
    req.body;
  if (!title || !category) {
    return res.status(400).json({ error: "标题和类别是必填项" });
  }
  try {
    const query = `
          INSERT INTO emergency_kit_items (user_id, title, category, estimated_duration_minutes, steps, requires_tools)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *;
      `;
    const result = await db.query(query, [
      userId,
      title,
      category,
      estimated_duration_minutes,
      steps,
      requires_tools,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("创建急救包条目时出错:", err);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

/**
 * @route   GET /api/emergency-kit/recommendations
 * @desc    获取前3个已启用的急救建议
 * @access  Private
 */
router.get("/recommendations", async (req, res) => {
  const userId = req.user.id;
  try {
    const query = `
      SELECT id, title, estimated_duration_minutes
      FROM emergency_kit_items
      WHERE user_id = $1 AND is_enabled = TRUE
      ORDER BY sort_order ASC
      LIMIT 3;
    `;
    const result = await db.query(query, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error("获取急救建议时出错:", err);
    res.status(500).json({ error: "服务器内部错误" });
  }
});
/**
 * @route   DELETE /api/emergency-kit/item/:id
 * @desc    删除一个急救包条目
 * @access  Private
 */
router.delete("/item/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const query = `
          DELETE FROM emergency_kit_items
          WHERE id = $1 AND user_id = $2
          RETURNING id;
      `;
    const result = await db.query(query, [id, userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "未找到项目或无权限" });
    }
    res.status(200).json({ message: "删除成功", id });
  } catch (err) {
    console.error("删除急救包条目时出错:", err);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

/**
 * @route   POST /api/emergency-kit/log
 * @desc    记录一次急救动作的完成
 * @access  Private
 */
router.post("/log", async (req, res) => {
  const { itemId, emotionLogId } = req.body;
  const userId = req.user.id;

  if (!itemId) {
    return res.status(400).json({ error: "缺少急救条目ID (itemId)" });
  }

  try {
    // 验证该 item 属于当前用户
    const itemCheck = await db.query(
      "SELECT id FROM emergency_kit_items WHERE id = $1 AND user_id = $2",
      [itemId, userId]
    );
    if (itemCheck.rowCount === 0) {
      return res.status(404).json({ error: "未找到指定的急救条目或无权限" });
    }

    const query = `
      INSERT INTO emergency_action_logs (user_id, item_id, emotion_log_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await db.query(query, [userId, itemId, emotionLogId]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("记录急救动作时出错:", err);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

/**
 * @route   GET /api/emergency-kit/items
 * @desc    获取用户所有的急救包条目（用于编辑页面）
 * @access  Private
 */
router.get("/items", async (req, res) => {
  const userId = req.user.id;
  try {
    const query = `
            SELECT * FROM emergency_kit_items
            WHERE user_id = $1
            ORDER BY sort_order ASC;
        `;
    const result = await db.query(query, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error("获取所有急救包条目时出错:", err);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

/**
 * @route   PUT /api/emergency-kit/item/:id
 * @desc    更新单个急救条目（例如启用/禁用）
 * @access  Private
 */
router.put("/item/:id", async (req, res) => {
  const { id } = req.params;
  const { is_enabled } = req.body;
  const userId = req.user.id;

  if (typeof is_enabled !== "boolean") {
    return res.status(400).json({ error: "is_enabled 必须是一个布尔值" });
  }

  try {
    const query = `
            UPDATE emergency_kit_items
            SET is_enabled = $1
            WHERE id = $2 AND user_id = $3
            RETURNING *;
        `;
    const result = await db.query(query, [is_enabled, id, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "未找到指定的急救条目或无权限" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("更新急救条目时出错:", err);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

/**
 * @route   PUT /api/emergency-kit/items/order
 * @desc    批量更新条目的排序
 * @access  Private
 */
router.put("/items/order", async (req, res) => {
  const { orderedIds } = req.body; // e.g., [3, 1, 2]
  const userId = req.user.id;

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res
      .status(400)
      .json({ error: "需要提供一个包含ID的数组 (orderedIds)" });
  }

  try {
    const client = await db.getClient();
    await client.query("BEGIN");

    const updatePromises = orderedIds.map((id, index) => {
      return client.query(
        "UPDATE emergency_kit_items SET sort_order = $1 WHERE id = $2 AND user_id = $3",
        [index, id, userId]
      );
    });

    await Promise.all(updatePromises);
    await client.query("COMMIT");
    res.status(200).json({ message: "排序已更新" });
  } catch (err) {
    await db.getClient().query("ROLLBACK");
    console.error("更新急救包排序时出错:", err);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

module.exports = router;
