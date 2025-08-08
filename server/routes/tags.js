const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/authMiddleware");

// 获取看板的所有标签
router.get("/board/:boardId", auth, async (req, res) => {
  const boardId = req.params.boardId;
  const userId = req.user.id;

  try {
    // 验证用户是否有权限访问这个看板
    const boardCheck = await db.query(
      "SELECT id FROM boards WHERE id = $1 AND user_id = $2",
      [boardId, userId]
    );

    if (boardCheck.rowCount === 0) {
      return res.status(403).json({ msg: "无权访问此看板" });
    }

    // 获取看板的所有标签
    const tagsResult = await db.query(
      `SELECT id, name, color, created_at 
       FROM tags 
       WHERE board_id = $1 
       ORDER BY name ASC`,
      [boardId]
    );

    res.json(tagsResult.rows);
  } catch (error) {
    console.error("获取标签失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 创建新标签
router.post("/", auth, async (req, res) => {
  const { name, color, boardId } = req.body;
  const userId = req.user.id;

  try {
    // 验证输入
    if (!name || !color || !boardId) {
      return res.status(400).json({ msg: "标签名称、颜色和看板ID都是必需的" });
    }

    // 验证颜色格式（简单的十六进制颜色验证）
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      return res.status(400).json({ msg: "颜色格式无效" });
    }

    // 验证用户是否有权限访问这个看板
    const boardCheck = await db.query(
      "SELECT id FROM boards WHERE id = $1 AND user_id = $2",
      [boardId, userId]
    );

    if (boardCheck.rowCount === 0) {
      return res.status(403).json({ msg: "无权访问此看板" });
    }

    // 检查标签名是否已存在
    const existingTag = await db.query(
      "SELECT id FROM tags WHERE name = $1 AND board_id = $2",
      [name, boardId]
    );

    if (existingTag.rowCount > 0) {
      return res.status(400).json({ msg: "标签名已存在" });
    }

    // 创建新标签
    const newTagResult = await db.query(
      `INSERT INTO tags (name, color, board_id) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, color, created_at`,
      [name, color, boardId]
    );

    res.status(201).json(newTagResult.rows[0]);
  } catch (error) {
    console.error("创建标签失败:", error);
    if (error.code === '23505') { // 唯一约束违反
      res.status(400).json({ msg: "标签名已存在" });
    } else {
      res.status(500).json({ message: "服务器错误" });
    }
  }
});

// 更新标签
router.put("/:id", auth, async (req, res) => {
  const tagId = req.params.id;
  const { name, color } = req.body;
  const userId = req.user.id;

  try {
    // 验证输入
    if (!name || !color) {
      return res.status(400).json({ msg: "标签名称和颜色都是必需的" });
    }

    // 验证颜色格式
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      return res.status(400).json({ msg: "颜色格式无效" });
    }

    // 验证用户是否有权限修改这个标签
    const authCheck = await db.query(
      `SELECT t.id FROM tags t
       JOIN boards b ON t.board_id = b.id
       WHERE t.id = $1 AND b.user_id = $2`,
      [tagId, userId]
    );

    if (authCheck.rowCount === 0) {
      return res.status(403).json({ msg: "无权修改此标签" });
    }

    // 更新标签
    const updateResult = await db.query(
      `UPDATE tags 
       SET name = $1, color = $2 
       WHERE id = $3 
       RETURNING id, name, color, created_at`,
      [name, color, tagId]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ msg: "标签不存在" });
    }

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error("更新标签失败:", error);
    if (error.code === '23505') {
      res.status(400).json({ msg: "标签名已存在" });
    } else {
      res.status(500).json({ message: "服务器错误" });
    }
  }
});

// 删除标签
router.delete("/:id", auth, async (req, res) => {
  const tagId = req.params.id;
  const userId = req.user.id;

  try {
    // 验证用户是否有权限删除这个标签
    const authCheck = await db.query(
      `SELECT t.id FROM tags t
       JOIN boards b ON t.board_id = b.id
       WHERE t.id = $1 AND b.user_id = $2`,
      [tagId, userId]
    );

    if (authCheck.rowCount === 0) {
      return res.status(403).json({ msg: "无权删除此标签" });
    }

    // 删除标签（会自动删除相关的卡片标签关联）
    const deleteResult = await db.query(
      "DELETE FROM tags WHERE id = $1 RETURNING *",
      [tagId]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ msg: "标签不存在" });
    }

    res.json({ 
      msg: "标签删除成功", 
      deletedTag: deleteResult.rows[0] 
    });
  } catch (error) {
    console.error("删除标签失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 为卡片添加标签
router.post("/card/:cardId", auth, async (req, res) => {
  const cardId = req.params.cardId;
  const { tagId } = req.body;
  const userId = req.user.id;

  try {
    // 验证用户是否有权限修改这个卡片
    const authCheck = await db.query(
      `SELECT c.id FROM cards c
       JOIN lists l ON c.list_id = l.id
       JOIN boards b ON l.board_id = b.id
       WHERE c.id = $1 AND b.user_id = $2`,
      [cardId, userId]
    );

    if (authCheck.rowCount === 0) {
      return res.status(403).json({ msg: "无权修改此卡片" });
    }

    // 验证标签是否存在且属于同一个看板
    const tagCheck = await db.query(
      `SELECT t.id FROM tags t
       JOIN boards b ON t.board_id = b.id
       JOIN lists l ON l.board_id = b.id
       JOIN cards c ON c.list_id = l.id
       WHERE t.id = $1 AND c.id = $2`,
      [tagId, cardId]
    );

    if (tagCheck.rowCount === 0) {
      return res.status(400).json({ msg: "标签不存在或不属于同一看板" });
    }

    // 添加卡片标签关联
    const result = await db.query(
      `INSERT INTO card_tags (card_id, tag_id) 
       VALUES ($1, $2) 
       ON CONFLICT (card_id, tag_id) DO NOTHING
       RETURNING *`,
      [cardId, tagId]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ msg: "标签已经存在于此卡片" });
    }

    res.status(201).json({ msg: "标签添加成功" });
  } catch (error) {
    console.error("添加卡片标签失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 从卡片移除标签
router.delete("/card/:cardId/:tagId", auth, async (req, res) => {
  const { cardId, tagId } = req.params;
  const userId = req.user.id;

  try {
    // 验证用户是否有权限修改这个卡片
    const authCheck = await db.query(
      `SELECT c.id FROM cards c
       JOIN lists l ON c.list_id = l.id
       JOIN boards b ON l.board_id = b.id
       WHERE c.id = $1 AND b.user_id = $2`,
      [cardId, userId]
    );

    if (authCheck.rowCount === 0) {
      return res.status(403).json({ msg: "无权修改此卡片" });
    }

    // 移除卡片标签关联
    const result = await db.query(
      "DELETE FROM card_tags WHERE card_id = $1 AND tag_id = $2 RETURNING *",
      [cardId, tagId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ msg: "卡片标签关联不存在" });
    }

    res.json({ msg: "标签移除成功" });
  } catch (error) {
    console.error("移除卡片标签失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 获取卡片的所有标签
router.get("/card/:cardId", auth, async (req, res) => {
  const cardId = req.params.cardId;
  const userId = req.user.id;

  try {
    // 验证用户是否有权限访问这个卡片
    const authCheck = await db.query(
      `SELECT c.id FROM cards c
       JOIN lists l ON c.list_id = l.id
       JOIN boards b ON l.board_id = b.id
       WHERE c.id = $1 AND b.user_id = $2`,
      [cardId, userId]
    );

    if (authCheck.rowCount === 0) {
      return res.status(403).json({ msg: "无权访问此卡片" });
    }

    // 获取卡片的所有标签
    const tagsResult = await db.query(
      `SELECT t.id, t.name, t.color, t.created_at
       FROM tags t
       JOIN card_tags ct ON t.id = ct.tag_id
       WHERE ct.card_id = $1
       ORDER BY t.name ASC`,
      [cardId]
    );

    res.json(tagsResult.rows);
  } catch (error) {
    console.error("获取卡片标签失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

module.exports = router;