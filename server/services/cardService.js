/**
 * 业务逻辑层
 * 负责处理复杂的业务流程，编排多个 Model 调用
 */

const db = require("../db");
const cardModel = require("../models/cardModel");
const { AppError } = require("../utils/errorHandler");

const emotionToDbColumn = {
  冷静: "emotion_calm",
  焦虑: "emotion_anxious",
  紧张: "emotion_tense",
  愉快: "emotion_happy",
};

/**
 * 更新每日分析指标
 * @param {number} userId - 用户ID
 * @param {object} updates - 包含 isCompleted 和 emotionChange 的对象
 */
const updateDailyMetrics = async (userId, updates) => {
  const { isCompleted, emotionChange } = updates;

  if (!isCompleted && !emotionChange) {
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const tasksIncrement = isCompleted ? 1 : 0;

  const emotionIncrements = {
    emotion_calm: 0,
    emotion_anxious: 0,
    emotion_tense: 0,
    emotion_happy: 0,
  };

  if (emotionChange) {
    const { oldEmotion, newEmotion } = emotionChange;
    if (oldEmotion && emotionToDbColumn[oldEmotion]) {
      const column = emotionToDbColumn[oldEmotion];
      emotionIncrements[column] = -1;
    }
    if (newEmotion && emotionToDbColumn[newEmotion]) {
      const column = emotionToDbColumn[newEmotion];
      emotionIncrements[column] = (emotionIncrements[column] || 0) + 1;
    }
  }

  const upsertQuery = `
    INSERT INTO daily_metrics (metric_date, user_id, tasks_completed, emotion_calm, emotion_anxious, emotion_tense, emotion_happy, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    ON CONFLICT (metric_date, user_id) 
    DO UPDATE SET
      tasks_completed = daily_metrics.tasks_completed + EXCLUDED.tasks_completed,
      emotion_calm = GREATEST(0, daily_metrics.emotion_calm + $4),
      emotion_anxious = GREATEST(0, daily_metrics.emotion_anxious + $5),
      emotion_tense = GREATEST(0, daily_metrics.emotion_tense + $6),
      emotion_happy = GREATEST(0, daily_metrics.emotion_happy + $7),
      updated_at = CURRENT_TIMESTAMP;
  `;

  const queryParams = [
    today,
    userId,
    tasksIncrement,
    emotionIncrements.emotion_calm,
    emotionIncrements.emotion_anxious,
    emotionIncrements.emotion_tense,
    emotionIncrements.emotion_happy,
  ];

  try {
    await db.query(upsertQuery, queryParams);
  } catch (err) {
    console.error("更新 daily_metrics 时数据库查询错误:", err);
    throw new AppError("Failed to update daily metrics", 500);
  }
};

/**
 * 获取用户的所有卡片
 * @param {number} userId - 用户ID
 * @returns {Promise<Array>} - 返回卡片数组
 */
const getAllUserCards = async (userId) => {
  return cardModel.getAllUserCards(userId);
};

/**
 * 更新卡片详情的核心业务逻辑
 * @param {number} cardId - 卡片ID
 * @param {number} userId - 用户ID
 * @param {object} cardData - 从请求体接收的卡片更新数据
 * @returns {Promise<object>} - 返回更新后完整的卡片信息
 */
const updateCardDetails = async (cardId, userId, cardData) => {
  // 1. 获取卡片更新前的状态
  const currentCard = await cardModel.getCardDetailsById(cardId);
  if (!currentCard) {
    throw new AppError("Card not found", 404);
  }

  // 2. 执行更新
  const updatedCard = await cardModel.updateCard(cardId, cardData);

  // 3. 检查状态变更，并触发副作用（记录日志、更新分析数据）
  const { status, emotion } = cardData;

  // 如果状态变为 "Done"
  if (status === "Done" && currentCard.status !== "Done") {
    await cardModel.logCompletion(userId, cardId, updatedCard.emotion);
  }

  // 准备分析数据
  const metricUpdates = {};
  if (status === "Done" && currentCard.status !== "Done") {
    metricUpdates.isCompleted = true;
  }
  if (emotion !== undefined && emotion !== currentCard.emotion) {
    metricUpdates.emotionChange = {
      oldEmotion: currentCard.emotion,
      newEmotion: emotion,
    };
  }

  // 如果有需要更新的分析数据，则调用更新函数
  if (Object.keys(metricUpdates).length > 0) {
    await updateDailyMetrics(userId, metricUpdates);
  }

  // 4. 返回最新、最完整的卡片数据
  return updatedCard;
};

/**
 * 删除卡片
 * @param {number} cardId - 卡片ID
 * @param {number} userId - 用户ID（虽然 canAccessCard 已验证，但保持一致性）
 * @returns {Promise<boolean>} - 返回是否删除成功
 */
const deleteCard = async (cardId, userId) => {
  // 可以在这里添加额外的业务逻辑，比如：
  // - 删除相关的时间记录
  // - 发送通知
  // - 记录删除日志等

  const deleted = await cardModel.deleteCard(cardId);
  if (!deleted) {
    throw new AppError("卡片未找到或已被删除", 404);
  }
  return deleted;
};

/**
 * 更新卡片顺序
 * @param {Array} cards - 卡片数组
 * @param {number} userId - 用户ID
 * @returns {Promise<void>}
 */
const updateCardsOrder = async (cards, userId) => {
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new AppError("请求体需要一个包含卡片信息的数组", 400);
  }

  await cardModel.updateCardsOrder(cards, userId);
};

module.exports = {
  getAllUserCards,
  updateCardDetails,
  deleteCard,
  updateCardsOrder,
};
