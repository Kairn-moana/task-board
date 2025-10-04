import { api } from "../../utils/apiUtils.js";

/**
 * 获取用户所有的奖励项目
 * @returns {Promise<Array<object>>} 奖励项目列表
 */
export const getRewardItems = async () => {
  try {
    const response = await api.get("/rewards/items");
    return response.data;
  } catch (error) {
    console.error("获取奖励项目时出错:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 创建一个新的奖励项目
 * @param {object} itemData - 新项目的数据
 * @returns {Promise<object>} 新创建的项目
 */
export const createRewardItem = async (itemData) => {
  try {
    const response = await api.post("/rewards/items", itemData);
    return response.data;
  } catch (error) {
    console.error("创建奖励项目时出错:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 更新一个奖励项目
 * @param {number|string} itemId - 项目ID
 * @param {object} updates - 更新的数据
 * @returns {Promise<object>} 更新后的项目
 */
export const updateRewardItem = async (itemId, updates) => {
  try {
    const response = await api.put(`/rewards/item/${itemId}`, updates);
    return response.data;
  } catch (error) {
    console.error(
      `更新奖励项目 ${itemId} 时出错:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * 删除一个奖励项目
 * @param {number|string} itemId - 项目ID
 * @returns {Promise<object>} 删除确认信息
 */
export const deleteRewardItem = async (itemId) => {
  try {
    const response = await api.delete(`/rewards/item/${itemId}`);
    return response.data;
  } catch (error) {
    console.error(
      `删除奖励项目 ${itemId} 时出错:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * 获取一个智能推荐的奖励
 * @param {object} options - 可选参数
 * @param {number} [options.budget] - 预算上限
 * @returns {Promise<object>} 返回包含建议和是否为备用选项的对象
 */
export const getRewardSuggestion = async (options = {}) => {
  try {
    const response = await api.get("/rewards/suggestion", { params: options });
    return response.data;
  } catch (error) {
    console.error("获取奖励建议时出错:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 记录一次奖励的领取
 * @param {object} logData - 日志数据
 * @param {number} logData.reward_item_id - 领取的奖励ID
 * @param {number} [logData.card_id] - 关联的任务卡片ID (可选)
 * @returns {Promise<object>} 服务器返回的新日志记录
 */
export const logRewardRedemption = async (logData) => {
  // 注意：后端的相应 API 尚未创建，这里是预留实现
  // try {
  //   const response = await api.post('/rewards/log', logData);
  //   return response.data;
  // } catch (error) {
  //   console.error('记录奖励领取时出错:', error.response?.data || error.message);
  //   throw error;
  // }
  console.log("模拟记录奖励领取:", logData);
  return Promise.resolve({ success: true, ...logData });
};
