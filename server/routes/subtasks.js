const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { canAccessCard } = require("../middleware/cardAuth");
const subtaskModel = require("../models/subtaskModel");
const ResponseHandler = require("../utils/responseHandler");
const { asyncHandler } = require("../utils/errorHandler");

// 所有子任务相关的路由都需要登录验证
router.use(auth);

/**
 * @route   PUT /api/subtasks/:cardId/sync
 * @desc    同步指定卡片的所有子任务
 * @access  Private (需要卡片所有权)
 */
router.put(
  "/card/:cardId/sync",
  canAccessCard,
  asyncHandler(async (req, res) => {
    const { cardId } = req.params;
    const { subtasks } = req.body;

    // 基本的数据验证
    if (!Array.isArray(subtasks)) {
      return ResponseHandler.badRequest(
        res,
        "请求体必须包含一个名为 'subtasks' 的数组。"
      );
    }

    const updatedSubtasks = await subtaskModel.syncSubtasks(
      parseInt(cardId, 10),
      subtasks
    );

    return ResponseHandler.success(res, updatedSubtasks, "同步子任务成功");
  })
);

module.exports = router;
