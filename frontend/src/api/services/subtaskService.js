// 子任务相关的API服务
import { api } from "../../utils/apiUtils.js";

export const subtaskService = {
  /**
   * 同步指定卡片的所有子任务
   * @param {number} cardId - 卡片ID
   * @param {Array<object>} subtasks - 子任务对象数组
   */
  async syncSubtasks(cardId, subtasks) {
    return api.put(`/subtasks/card/${cardId}/sync`, { subtasks });
  },
};
