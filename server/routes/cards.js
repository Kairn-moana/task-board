const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/authMiddleware");
const { canAccessCard } = require("../middleware/cardAuth");
const cardModel = require("../models/cardModel");
const cardService = require("../services/cardService");
const ResponseHandler = require("../utils/responseHandler");
const { asyncHandler } = require("../utils/errorHandler");

// 所有卡片相关的操作都需要先登录
router.use(auth);

// 获取用户的所有卡片
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const query = `
    SELECT c.* FROM cards c
    JOIN lists l ON c.list_id = l.id
    JOIN boards b ON l.board_id = b.id
    WHERE b.user_id = $1
    ORDER BY c.id;
  `;

    const result = await db.query(query, [userId]);
    return ResponseHandler.success(res, result.rows, "获取卡片列表成功");
  })
);

// 获取单个卡片的详细信息
router.get(
  "/:id",
  canAccessCard,
  asyncHandler(async (req, res) => {
    const card = await cardModel.getCardDetailsById(req.params.id);
    if (!card) {
      return ResponseHandler.notFound(res, "卡片未找到");
    }
    return ResponseHandler.success(res, card, "获取卡片详情成功");
  })
);

// 更新卡片
router.put(
  "/:id",
  canAccessCard,
  asyncHandler(async (req, res) => {
    const cardId = req.params.id;
    const userId = req.user.id;
    const cardData = req.body;

    const updatedCard = await cardService.updateCardDetails(
      cardId,
      userId,
      cardData
    );

    return ResponseHandler.success(res, updatedCard, "更新卡片成功");
  })
);

// 删除卡片
router.delete(
  "/:id",
  canAccessCard,
  asyncHandler(async (req, res) => {
    const cardId = req.params.id;
    const deleteQuery = `DELETE FROM cards WHERE id = $1`;
    const result = await db.query(deleteQuery, [cardId]);

    if (result.rowCount === 0) {
      return ResponseHandler.notFound(res, "卡片未找到或已被删除");
    }

    return ResponseHandler.success(res, null, "卡片已成功删除");
  })
);

// 更新卡片顺序
router.put(
  "/update-order",
  asyncHandler(async (req, res) => {
    const { cards } = req.body;
    const userId = req.user.id;

    // 基本的验证，确保前端发送了正确的数据
    if (!Array.isArray(cards) || cards.length === 0) {
      return ResponseHandler.badRequest(
        res,
        "请求体需要一个包含卡片信息的数组"
      );
    }

    const client = await db.pool.connect();

    try {
      await client.query("BEGIN");

      // 安全性检查：一次性验证所有要被更新的卡片都属于当前用户
      const cardIds = cards.map((c) => c.id);
      const authQuery = `
      SELECT c.id FROM cards c
      JOIN lists l ON c.list_id = l.id
      JOIN boards b ON l.board_id = b.id
      WHERE b.user_id = $1 AND c.id = ANY($2::int[])
    `;
      const authResult = await client.query(authQuery, [userId, cardIds]);

      if (authResult.rowCount !== cardIds.length) {
        await client.query("ROLLBACK");
        return ResponseHandler.forbidden(
          res,
          "权限错误：你正试图修改不属于你的卡片"
        );
      }

      // 遍历前端传来的每一张卡片信息，并执行更新
      for (const card of cards) {
        const updateQuery = `
        UPDATE cards 
        SET "order" = $1, list_id = $2 
        WHERE id = $3
      `;
        await client.query(updateQuery, [card.order, card.list_id, card.id]);
      }

      await client.query("COMMIT");
      return ResponseHandler.success(res, null, "卡片顺序已成功更新");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err; // asyncHandler会处理这个错误
    } finally {
      client.release();
    }
  })
);

module.exports = router;
