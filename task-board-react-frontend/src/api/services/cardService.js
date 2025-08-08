// 卡片相关的API服务
import { api } from '../../utils/apiUtils.js';

export const cardService = {
  // 获取卡片详情
  async getCard(cardId) {
    return api.get(`/cards/${cardId}`);
  },

  // 更新卡片详情
  async updateCard(cardId, updates) {
    return api.put(`/cards/${cardId}`, updates);
  },

  // 删除卡片
  async deleteCard(cardId) {
    return api.delete(`/cards/${cardId}`);
  },

  // 更新卡片顺序
  async updateCardsOrder(cards) {
    return api.put('/cards/update-order', { cards });
  },

  // 移动卡片到新列表
  async moveCard(cardId, newListId, newOrder) {
    return api.put(`/cards/${cardId}/move`, {
      newListId,
      newOrder
    });
  },
};
