import { api } from "../../utils/apiUtils.js";

/**
 * 保存晚间复盘内容
 * @param {object} reviewData - 复盘数据
 * @param {string} reviewData.happy - 开心的事
 * @param {string} reviewData.tense - 紧张的事
 * @param {string} reviewData.welldone - 做得好的事
 * @returns {Promise<object>} 新创建的复盘日志条目
 */
export const saveEveningReview = async (reviewData) => {
  try {
    const response = await api.post("/emotions/review", reviewData);
    return response.data;
  } catch (error) {
    console.error("保存晚间复盘时出错:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 记录一个新的情绪条目
 * @param {object} emotionData - 要记录的情绪数据
 * @param {string} emotionData.emotion - 情绪表情或标识符
 * @param {number} [emotionData.intensity] - 可选的强度等级 (0-4)
 * @returns {Promise<object>} 新创建的日志条目
 */
export const logEmotion = async (emotionData) => {
  try {
    const response = await api.post("/emotions/log", emotionData);
    return response.data;
  } catch (error) {
    console.error("记录情绪时出错:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 删除一个情绪日志条目
 * @param {number|string} logId - 要删除的日志ID
 * @returns {Promise<object>} 服务器的确认消息
 */
export const deleteEmotionLog = async (logId) => {
  try {
    const response = await api.delete(`/emotions/log/${logId}`);
    return response.data;
  } catch (error) {
    console.error(
      `删除情绪日志 ${logId} 时出错:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * 获取当天的所有情绪日志
 * @returns {Promise<Array<object>>} 今天的的情绪日志条目列表
 */
export const getTodaysEmotionLogs = async () => {
  try {
    const response = await api.get("/emotions/logs/today");
    return response.data;
  } catch (error) {
    console.error(
      "获取今日情绪日志时出错:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * 获取所有情绪日志历史 (用于情绪日记)
 * @returns {Promise<Array<object>>} 用户的情绪日志历史
 */
export const getEmotionLogHistory = async () => {
  try {
    const response = await api.get("/emotions/logs");
    return response.data;
  } catch (error) {
    console.error(
      "获取情绪日志历史时出错:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * 获取用户可用的情绪快捷标签
 * @returns {Promise<Array<object>>} 用户的快捷标签列表
 */
export const getEmotionTags = async () => {
  try {
    const response = await api.get("/emotions/tags");
    return response.data;
  } catch (error) {
    console.error("获取情绪标签时出错:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 为情绪日志添加一个标签
 * @param {number|string} logId - 日志的ID
 * @param {number|string} tagId - 要添加的标签ID
 * @returns {Promise<object>} 服务器的确认响应
 */
export const addTagToLog = async (logId, tagId) => {
  try {
    const response = await api.post(`/emotions/log/${logId}/tags`, { tagId });
    return response.data;
  } catch (error) {
    console.error(
      `为日志 ${logId} 添加标签时出错:`,
      error.response?.data || error.message
    );
    throw error;
  }
};
