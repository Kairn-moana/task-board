/**
 * 奖励系统业务逻辑层
 */

const rewardModel = require("../models/rewardModel");
const { AppError } = require("../utils/errorHandler");

/**
 * 获取智能推荐奖励
 */
const getRewardSuggestion = async (userId, budget) => {
  // 获取最近24小时已领取的奖励
  const recentIds = await rewardModel.getRecentRedemptions(userId);

  // 尝试获取符合条件的奖励
  let suggestion = await rewardModel.getSuggestedReward(
    userId,
    budget,
    recentIds
  );

  if (suggestion) {
    return { suggestion, is_fallback: false };
  }

  // 备用策略：忽略24小时限制
  suggestion = await rewardModel.getFallbackReward(userId);

  if (suggestion) {
    return { suggestion, is_fallback: true };
  }

  throw new AppError("没有可用的奖励", 404);
};

/**
 * 获取所有奖励
 */
const getAllRewards = async (userId) => {
  return rewardModel.getAllRewards(userId);
};

/**
 * 创建奖励
 */
const createReward = async (userId, rewardData) => {
  if (!rewardData.title) {
    throw new AppError("标题是必填项", 400);
  }
  return rewardModel.createReward(userId, rewardData);
};

/**
 * 更新奖励
 */
const updateReward = async (rewardId, userId, updates) => {
  const updatedReward = await rewardModel.updateReward(
    rewardId,
    userId,
    updates
  );
  if (!updatedReward) {
    throw new AppError("未找到项目或无权限", 404);
  }
  return updatedReward;
};

/**
 * 删除奖励
 */
const deleteReward = async (rewardId, userId) => {
  const deleted = await rewardModel.deleteReward(rewardId, userId);
  if (!deleted) {
    throw new AppError("未找到项目或无权限", 404);
  }
  return true;
};

module.exports = {
  getRewardSuggestion,
  getAllRewards,
  createReward,
  updateReward,
  deleteReward,
};
