// 统一导出所有API服务
export { boardService } from './boardService.js';
export { cardService } from './cardService.js';
export { attachmentService } from './attachmentService.js';
export { tagService } from './tagService.js';
export { authService } from './authService.js';

// 为了向后兼容，保留旧的API函数名
export { 
  boardService as BoardAPI,
  cardService as CardAPI,
  attachmentService as AttachmentAPI,
  tagService as TagAPI,
  authService as AuthAPI
};
