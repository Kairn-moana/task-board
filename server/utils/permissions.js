// 权限检查工具
const db = require('../db');
const { AppError } = require('./errorHandler');

// 检查用户是否有看板访问权限
const checkBoardAccess = async (userId, boardId) => {
  const result = await db.query(
    'SELECT id FROM boards WHERE id = $1 AND user_id = $2',
    [boardId, userId]
  );
  
  if (result.rows.length === 0) {
    throw new AppError('无权访问此看板', 403, 'BOARD_ACCESS_DENIED');
  }
  
  return result.rows[0];
};

// 检查用户是否有列表访问权限
const checkListAccess = async (userId, listId) => {
  const result = await db.query(
    `SELECT l.id, l.board_id FROM lists l
     JOIN boards b ON l.board_id = b.id
     WHERE l.id = $1 AND b.user_id = $2`,
    [listId, userId]
  );
  
  if (result.rows.length === 0) {
    throw new AppError('无权访问此列表', 403, 'LIST_ACCESS_DENIED');
  }
  
  return result.rows[0];
};

// 检查用户是否有卡片访问权限
const checkCardAccess = async (userId, cardId) => {
  const result = await db.query(
    `SELECT c.id, c.list_id, l.board_id FROM cards c
     JOIN lists l ON c.list_id = l.id
     JOIN boards b ON l.board_id = b.id
     WHERE c.id = $1 AND b.user_id = $2`,
    [cardId, userId]
  );
  
  if (result.rows.length === 0) {
    throw new AppError('无权访问此卡片', 403, 'CARD_ACCESS_DENIED');
  }
  
  return result.rows[0];
};

// 检查用户是否有附件访问权限
const checkAttachmentAccess = async (userId, attachmentId) => {
  const result = await db.query(
    `SELECT a.id, a.card_id FROM attachments a
     JOIN cards c ON a.card_id = c.id
     JOIN lists l ON c.list_id = l.id
     JOIN boards b ON l.board_id = b.id
     WHERE a.id = $1 AND b.user_id = $2`,
    [attachmentId, userId]
  );
  
  if (result.rows.length === 0) {
    throw new AppError('无权访问此附件', 403, 'ATTACHMENT_ACCESS_DENIED');
  }
  
  return result.rows[0];
};

// 检查用户是否有标签访问权限
const checkTagAccess = async (userId, tagId) => {
  const result = await db.query(
    `SELECT t.id, t.board_id FROM tags t
     JOIN boards b ON t.board_id = b.id
     WHERE t.id = $1 AND b.user_id = $2`,
    [tagId, userId]
  );
  
  if (result.rows.length === 0) {
    throw new AppError('无权访问此标签', 403, 'TAG_ACCESS_DENIED');
  }
  
  return result.rows[0];
};

module.exports = {
  checkBoardAccess,
  checkListAccess,
  checkCardAccess,
  checkAttachmentAccess,
  checkTagAccess
};
