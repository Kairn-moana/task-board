// 看板相关的API服务
import { api } from "../../utils/apiUtils.js";

export const boardService = {
  // 获取用户的所有看板
  async getBoards() {
    return api.get("/boards");
  },

  // 获取指定看板的详细信息
  async getBoardDetails(boardId) {
    return api.get(`/boards/${boardId}`);
  },

  // 创建新看板
  async createBoard(title) {
    return api.post("/boards", { title });
  },

  // 更新看板信息
  async updateBoard(boardId, updates) {
    return api.put(`/boards/${boardId}`, updates);
  },

  // 删除看板
  async deleteBoard(boardId) {
    return api.delete(`/boards/${boardId}`);
  },

  // 在指定看板下创建列表
  async createList(boardId, title) {
    return api.post(`/boards/${boardId}/lists`, { title });
  },

  // 在指定列表下创建卡片
  async createCard(boardId, listId, title) {
    return api.post(`/boards/${boardId}/lists/${listId}/cards`, { title });
  },
};
