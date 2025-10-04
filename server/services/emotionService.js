/**
 * 情绪日志业务逻辑层
 */

const emotionModel = require("../models/emotionModel");
const { AppError } = require("../utils/errorHandler");

/**
 * 获取用户的所有情绪日志
 */
const getAllEmotionLogs = async (userId) => {
  return emotionModel.getAllEmotionLogs(userId);
};

/**
 * 获取今日情绪日志
 */
const getTodayEmotionLogs = async (userId) => {
  return emotionModel.getTodayEmotionLogs(userId);
};

/**
 * 创建快速情绪记录
 */
const createEmotionLog = async (userId, emotion, intensity) => {
  if (!emotion) {
    throw new AppError("Emotion is required.", 400);
  }

  return emotionModel.createEmotionLog(userId, emotion, intensity);
};

/**
 * 创建晚间复盘
 */
const createReview = async (userId, reviewData) => {
  const { happy, tense, welldone } = reviewData;

  // 格式化复盘内容
  const notes = [
    `今天让我开心的是：\n${happy || "（未填写）"}`,
    `今天让我紧张的是：\n${tense || "（未填写）"}`,
    `我做得好的 1 件事是：\n${welldone || "（未填写）"}`,
  ].join("\n\n");

  return emotionModel.createReview(userId, notes);
};

/**
 * 删除情绪日志
 */
const deleteEmotionLog = async (logId, userId) => {
  const deleted = await emotionModel.deleteEmotionLog(logId, userId);
  if (!deleted) {
    throw new AppError("Log not found or user not authorized.", 404);
  }
  return true;
};

/**
 * 获取用户的情绪标签
 */
const getUserEmotionTags = async (userId) => {
  return emotionModel.getUserEmotionTags(userId);
};

/**
 * 为情绪日志添加标签
 */
const addTagToLog = async (logId, tagId, userId) => {
  if (!tagId) {
    throw new AppError("Tag ID is required.", 400);
  }

  // 验证日志所有权
  const hasAccess = await emotionModel.checkLogOwnership(logId, userId);
  if (!hasAccess) {
    throw new AppError("Log not found or not authorized.", 404);
  }

  const result = await emotionModel.addTagToLog(logId, tagId);
  return result;
};

module.exports = {
  getAllEmotionLogs,
  getTodayEmotionLogs,
  createEmotionLog,
  createReview,
  deleteEmotionLog,
  getUserEmotionTags,
  addTagToLog,
};
