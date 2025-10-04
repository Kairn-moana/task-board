import { api } from "../../utils/apiUtils.js";

export const analyticsService = {
  /**
   * 获取最近N天的分析数据
   * @param {number} days - 要获取的天数
   * @returns {Promise<any>}
   */
  async getAnalytics(days = 30) {
    return api.get(`/analytics?days=${days}`);
  },

  /**
   * 获取情绪时间线数据
   * @returns {Promise<any>}
   */
  async getEmotionTimeline() {
    return api.get("/analytics/emotion-timeline");
  },

  /**获取专注会话热力图 */
  async getFocusHeatmap(days = 30) {
    return api.get(`/analytics/focus-heatmap?days=${days}`);
  },

  /**
   * 根据当前情绪获取推荐任务
   * @param {string} emotion - 当前的情绪
   * @returns {Promise<any>}
   */ async getRecommendedTasks(emotion) {
    return api.get(`/analytics/recommend-tasks?emotion=${emotion}`);
  },

  // 每日小结+7天趋势
  async getSummary(days = 7) {
    return api.get(`/analytics/summary?days=${days}`);
  },
};

/**
 * Get the monthly summary card data.
 * @param {number} year - The year for the summary.
 * @param {number} month - The month for the summary (1-12).
 * @returns {Promise<object>} The monthly summary data.
 */
export const getMonthlySummary = async (year, month) => {
  console.log("🔍 getMonthlySummary 调用参数:", { year, month }); // 添加调试日志
  try {
    // 手动构建查询字符串，不使用 params 选项
    const url = `/analytics/monthly-summary?year=${year}&month=${month}`;
    const response = await api.get(url); // 只传 URL，不传 params
    console.log("✅ getMonthlySummary 成功:", response.data);
  } catch (error) {
    console.error(
      "❌ getMonthlySummary 错误:",
      error.response?.data || error.message
    );
    throw error;
  }
};
