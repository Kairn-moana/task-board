// 标签相关的API服务
import { api } from '../../utils/apiUtils.js';

export const tagService = {
  // 获取看板的所有标签
  async getBoardTags(boardId) {
    return api.get(`/tags/board/${boardId}`);
  },

  // 创建新标签
  async createTag(tagData) {
    return api.post('/tags', tagData);
  },

  // 更新标签
  async updateTag(tagId, tagData) {
    return api.put(`/tags/${tagId}`, tagData);
  },

  // 删除标签
  async deleteTag(tagId) {
    return api.delete(`/tags/${tagId}`);
  },

  // 为卡片添加标签
  async addTagToCard(cardId, tagId) {
    return api.post(`/tags/card/${cardId}`, { tagId });
  },

  // 从卡片移除标签
  async removeTagFromCard(cardId, tagId) {
    return api.delete(`/tags/card/${cardId}/${tagId}`);
  },

  // 获取卡片的所有标签
  async getCardTags(cardId) {
    return api.get(`/tags/card/${cardId}`);
  },
};
