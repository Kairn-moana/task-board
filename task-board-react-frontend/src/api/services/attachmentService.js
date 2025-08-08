// 附件相关的API服务
import { api } from '../../utils/apiUtils.js';

export const attachmentService = {
  // 上传附件
  async uploadAttachment(attachmentData) {
    return api.post('/attachments', attachmentData);
  },

  // 删除附件
  async deleteAttachment(attachmentId) {
    return api.delete(`/attachments/${attachmentId}`);
  },

  // 获取卡片的所有附件
  async getCardAttachments(cardId) {
    return api.get(`/cards/${cardId}/attachments`);
  },
};
