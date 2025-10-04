import { api } from "../../utils/apiUtils.js";

/**
 * 创建一个新的急救包条目
 * @param {object} itemData - 新条目的数据
 * @returns {Promise<object>} 新创建的条目
 */
export const createEmergencyKitItem = async (itemData) => {
  try {
    const response = await api.post("/emergency-kit/items", itemData);
    return response.data;
  } catch (error) {
    console.error(
      "创建急救包条目时出错:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * 获取急救建议推荐
 * @returns {Promise<Array<object>>} 返回最多3个急救建议
 */
export const getEmergencyRecommendations = async () => {
  try {
    const response = await api.get("/emergency-kit/recommendations");
    return response.data;
  } catch (error) {
    console.error("获取急救建议时出错:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 删除一个急救包条目
 * @param {number|string} itemId - 要删除的条目ID
 * @returns {Promise<object>} 删除确认信息
 */
export const deleteEmergencyKitItem = async (itemId) => {
  try {
    const response = await api.delete(`/emergency-kit/item/${itemId}`);
    return response.data;
  } catch (error) {
    console.error(
      `删除急救包条目 ${itemId} 时出错:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * 记录一个急救动作的完成
 * @param {object} logData - 日志数据
 * @param {number} logData.itemId - 完成的条目ID
 * @param {number} [logData.emotionLogId] - 关联的情绪记录ID (可选)
 * @returns {Promise<object>} 服务器返回的新日志记录
 */
export const logEmergencyAction = async (logData) => {
  try {
    const response = await api.post("/emergency-kit/log", logData);
    return response.data;
  } catch (error) {
    console.error("记录急救动作时出错:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 获取用户所有的急救包条目
 * @returns {Promise<Array<object>>} 用户的所有急救包条目列表
 */
export const getAllEmergencyKitItems = async () => {
  try {
    const response = await api.get("/emergency-kit/items");
    return response.data;
  } catch (error) {
    console.error(
      "获取所有急救包条目时出错:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * 更新单个急救条目的属性
 * @param {number|string} itemId - 要更新的条目ID
 * @param {object} updates - 要更新的属性，例如 { is_enabled: boolean }
 * @returns {Promise<object>} 更新后的条目对象
 */
export const updateEmergencyKitItem = async (itemId, updates) => {
  try {
    const response = await api.put(`/emergency-kit/item/${itemId}`, updates);
    return response.data;
  } catch (error) {
    console.error(
      `更新急救条目 ${itemId} 时出错:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * 更新急救包条目的排序
 * @param {Array<number>} orderedIds - 按新顺序排列的条目ID数组
 * @returns {Promise<object>} 服务器的确认消息
 */
export const updateEmergencyKitOrder = async (orderedIds) => {
  try {
    const response = await api.put("/emergency-kit/items/order", {
      orderedIds,
    });
    return response.data;
  } catch (error) {
    console.error(
      "更新急救包排序时出错:",
      error.response?.data || error.message
    );
    throw error;
  }
};
