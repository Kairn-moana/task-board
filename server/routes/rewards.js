const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const rewardService = require("../services/rewardService");
const ResponseHandler = require("../utils/responseHandler");
const { asyncHandler } = require("../utils/errorHandler");

router.use(auth);

// GET /api/rewards/suggestion - 智能推荐奖励
router.get(
  "/suggestion",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { budget } = req.query;

    const result = await rewardService.getRewardSuggestion(userId, budget);
    return ResponseHandler.success(res, result, "获取推荐成功");
  })
);

// GET /api/rewards/items - 获取所有奖励
router.get(
  "/items",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const rewards = await rewardService.getAllRewards(userId);
    return ResponseHandler.success(res, rewards, "获取奖励列表成功");
  })
);

// POST /api/rewards/items - 创建奖励
router.post(
  "/items",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const reward = await rewardService.createReward(userId, req.body);
    return ResponseHandler.success(res, reward, "创建奖励成功", 201);
  })
);

// PUT /api/rewards/item/:id - 更新奖励
router.put(
  "/item/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const reward = await rewardService.updateReward(id, userId, req.body);
    return ResponseHandler.success(res, reward, "更新奖励成功");
  })
);

// DELETE /api/rewards/item/:id - 删除奖励
router.delete(
  "/item/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    await rewardService.deleteReward(id, userId);
    return ResponseHandler.success(res, { id }, "删除奖励成功");
  })
);

module.exports = router;
