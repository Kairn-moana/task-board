/**
 * 时间记录业务逻辑层
 */

const timeEntryModel = require("../models/timeEntryModel");
const { AppError } = require("../utils/errorHandler");

/**
 * 获取卡片的所有时间记录
 */
const getCardTimeEntries = async (cardId, userId) => {
  // 检查权限
  const hasAccess = await timeEntryModel.checkCardAccess(cardId, userId);
  if (!hasAccess) {
    throw new AppError("无权访问此卡片", 403, "CARD_ACCESS_DENIED");
  }

  return timeEntryModel.getCardTimeEntries(cardId);
};

/**
 * 开始计时
 */
const startTimer = async (cardId, userId, note) => {
  if (!cardId) {
    throw new AppError("缺少 cardId", 400, "MISSING_CARD_ID");
  }

  // 检查卡片访问权限
  const hasAccess = await timeEntryModel.checkCardAccess(cardId, userId);
  if (!hasAccess) {
    throw new AppError("无权访问此卡片", 403, "CARD_ACCESS_DENIED");
  }

  // 检查是否已有正在进行的计时
  const runningTimer = await timeEntryModel.getRunningTimer(userId);
  if (runningTimer) {
    throw new AppError(
      "已有计时在进行中，请先停止",
      400,
      "TIMER_ALREADY_RUNNING"
    );
  }

  return timeEntryModel.startTimer(cardId, userId, note);
};

/**
 * 停止计时
 */
const stopTimer = async (userId, note) => {
  // 查找正在进行的计时
  const runningTimer = await timeEntryModel.getRunningTimer(userId);
  if (!runningTimer) {
    throw new AppError("没有进行中的计时", 400, "NO_RUNNING_TIMER");
  }

  return timeEntryModel.stopTimer(runningTimer.id, note);
};

/**
 * 获取卡片时间统计
 */
const getCardTimeSummary = async (cardId, userId) => {
  // 检查权限
  const hasAccess = await timeEntryModel.checkCardAccess(cardId, userId);
  if (!hasAccess) {
    throw new AppError("无权访问此卡片", 403, "CARD_ACCESS_DENIED");
  }

  const totalSeconds = await timeEntryModel.getCardTimeSummary(cardId);
  return { total_seconds: totalSeconds };
};

module.exports = {
  getCardTimeEntries,
  startTimer,
  stopTimer,
  getCardTimeSummary,
};
