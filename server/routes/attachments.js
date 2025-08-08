const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware"); // 确保这个路径正确
const db = require("../db"); // 引入我们的数据库连接

// 创建 POST /api/attachments (上传附件元数据)
router.post("/", auth, async (req, res) => {

  console.log("请求体 (req.body):", JSON.stringify(req.body, null, 2)); // 用更漂亮的格式打印
  console.log("来自 auth 中间件的用户信息 (req.user):", req.user);

  // 健壮性检查
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ msg: "请求体必须是一个 JSON 对象" });
  }

  const { card_id, file_name, file_url, file_type, file_size } = req.body;
  const userId = req.user.id;

  // 再次检查 card_id
  if (!card_id) {
    return res.status(400).json({ msg: "请求体中缺少 card_id" });
  }

  try {
    // 安全性检查：确认卡片属于当前用户
    const cardCheckQuery = `
        SELECT c.id FROM cards c
        JOIN lists l ON c.list_id = l.id
        JOIN boards b ON l.board_id = b.id
        WHERE c.id = $1 AND b.user_id = $2
    `;
    const cardCheckResult = await db.query(cardCheckQuery, [card_id, userId]);

    if (cardCheckResult.rowCount === 0) {
      return res.status(403).json({ msg: "无权在此卡片下添加附件" });
    }

    const insertQuery = `
        INSERT INTO attachments (file_name, file_url, file_type, card_id, file_size)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const newAttachmentResult = await db.query(insertQuery, [
      file_name,
      file_url,
      file_type,
      card_id,
      file_size,
    ]);

    res.status(201).json(newAttachmentResult.rows[0]);
  } catch (error) {
    console.error("保存附件时出错:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 删除 DELETE /api/attachments/:id (删除指定附件)
router.delete("/:id", auth, async (req, res) => {

  const attachmentId = req.params.id;
  const userId = req.user.id;

  try {
    // 安全性检查：确认附件属于当前用户的卡片
    const authCheckQuery = `
      SELECT a.id, a.card_id FROM attachments a
      JOIN cards c ON a.card_id = c.id
      JOIN lists l ON c.list_id = l.id
      JOIN boards b ON l.board_id = b.id
      WHERE a.id = $1 AND b.user_id = $2
    `;
    const authCheckResult = await db.query(authCheckQuery, [
      attachmentId,
      userId,
    ]);

    if (authCheckResult.rowCount === 0) {
      return res.status(403).json({ msg: "无权删除此附件或附件不存在" });
    }

    // 执行删除操作
    const deleteQuery = `
      DELETE FROM attachments 
      WHERE id = $1 
      RETURNING *
    `;
    const deleteResult = await db.query(deleteQuery, [attachmentId]);

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ msg: "附件不存在" });
    }

    res.json({
      msg: "附件删除成功",
      deletedAttachment: deleteResult.rows[0],
    });
  } catch (error) {
    console.error("删除附件时出错:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

module.exports = router;
