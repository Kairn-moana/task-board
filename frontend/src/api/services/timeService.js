import { api } from "../../utils/apiUtils.js";

export const timeService = {
  // 获取卡片的时间记录
  async listEntries(cardId) {
    return api.get(`/time-entries/card/${cardId}`);
  },

  // 开始计时
  async startTimer(cardId, note) {
    return api.post("/time-entries/start", { cardId, note });
  },

  // 停止计时
  async stopTimer(note) {
    return api.post("/time-entries/stop", { note });
  },

  // 获取卡片总时长统计
  async getCardSummary(cardId) {
    return api.get(`/time-entries/summary/card/${cardId}`);
  },
};

