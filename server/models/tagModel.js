// 负责标签相关的所有数据库操作
const db = require("../db");
const boardModel = require("./boardModel");

/**
 * 检查标签是否属于用户
 */
const checkTagOwnership = async (tagId, userId) => {
  const query = `
    SELECT t.id FROM tags t
    JOIN boards b ON t.board_id = b.id
    WHERE t.id = $1 AND b.user_id = $2
  `;
  const result = await db.query(query, [tagId, userId]);
  return result.rowCount > 0;
};

/**
 * 获取看板的所有标签
 */
const getBoardTags = async (boardId, userId) => {
  // 先验证权限
  const hasAccess = await boardModel.checkBoardOwnership(boardId, userId);
  if (!hasAccess) {
    return null;
  }

  const query = `
    SELECT id, name, color, created_at 
    FROM tags 
    WHERE board_id = $1 
    ORDER BY name ASC
  `;
  const result = await db.query(query, [boardId]);
  return result.rows;
};

/**
 * 检查标签名是否在看板中已存在
 */
const tagNameExists = async (name, boardId, excludeTagId = null) => {
  let query = `
    SELECT id FROM tags 
    WHERE name = $1 AND board_id = $2
  `;
  const params = [name, boardId];

  if (excludeTagId) {
    query += ` AND id != $3`;
    params.push(excludeTagId);
  }

  const result = await db.query(query, params);
  return result.rowCount > 0;
};

/**
 * 创建新标签
 */
const createTag = async (name, color, boardId, userId) => {
  // 验证权限
  const hasAccess = await boardModel.checkBoardOwnership(boardId, userId);
  if (!hasAccess) {
    return null;
  }

  const query = `
    INSERT INTO tags (name, color, board_id) 
    VALUES ($1, $2, $3) 
    RETURNING id, name, color, created_at
  `;
  const result = await db.query(query, [name, color, boardId]);
  return result.rows[0];
};

/**
 * 更新标签
 */
const updateTag = async (tagId, name, color, userId) => {
  // 验证权限
  const hasAccess = await checkTagOwnership(tagId, userId);
  if (!hasAccess) {
    return null;
  }

  const query = `
    UPDATE tags 
    SET name = $1, color = $2 
    WHERE id = $3 
    RETURNING id, name, color, created_at
  `;
  const result = await db.query(query, [name, color, tagId]);
  return result.rows[0] || null;
};

/**
 * 删除标签
 */
const deleteTag = async (tagId, userId) => {
  // 验证权限
  const hasAccess = await checkTagOwnership(tagId, userId);
  if (!hasAccess) {
    return null;
  }

  const query = `
    DELETE FROM tags 
    WHERE id = $1 
    RETURNING *
  `;
  const result = await db.query(query, [tagId]);
  return result.rows[0] || null;
};

/**
 * 检查用户是否有权访问卡片
 */
const checkCardAccess = async (cardId, userId) => {
  const query = `
    SELECT c.id FROM cards c
    JOIN lists l ON c.list_id = l.id
    JOIN boards b ON l.board_id = b.id
    WHERE c.id = $1 AND b.user_id = $2
  `;
  const result = await db.query(query, [cardId, userId]);
  return result.rowCount > 0;
};

/**
 * 检查标签和卡片是否在同一看板
 */
const tagAndCardInSameBoard = async (tagId, cardId) => {
  const query = `
    SELECT t.id FROM tags t
    JOIN boards b ON t.board_id = b.id
    JOIN lists l ON l.board_id = b.id
    JOIN cards c ON c.list_id = l.id
    WHERE t.id = $1 AND c.id = $2
  `;
  const result = await db.query(query, [tagId, cardId]);
  return result.rowCount > 0;
};

/**
 * 为卡片添加标签
 */
const addTagToCard = async (cardId, tagId, userId) => {
  // 验证卡片权限
  const hasCardAccess = await checkCardAccess(cardId, userId);
  if (!hasCardAccess) {
    return { success: false, error: "NO_ACCESS" };
  }

  // 验证标签和卡片是否在同一看板
  const inSameBoard = await tagAndCardInSameBoard(tagId, cardId);
  if (!inSameBoard) {
    return { success: false, error: "NOT_SAME_BOARD" };
  }

  const query = `
    INSERT INTO card_tags (card_id, tag_id) 
    VALUES ($1, $2) 
    ON CONFLICT (card_id, tag_id) DO NOTHING
    RETURNING *
  `;
  const result = await db.query(query, [cardId, tagId]);

  if (result.rowCount === 0) {
    return { success: false, error: "ALREADY_EXISTS" };
  }

  return { success: true, data: result.rows[0] };
};

/**
 * 从卡片移除标签
 */
const removeTagFromCard = async (cardId, tagId, userId) => {
  // 验证卡片权限
  const hasCardAccess = await checkCardAccess(cardId, userId);
  if (!hasCardAccess) {
    return null;
  }

  const query = `
    DELETE FROM card_tags 
    WHERE card_id = $1 AND tag_id = $2 
    RETURNING *
  `;
  const result = await db.query(query, [cardId, tagId]);
  return result.rows[0] || null;
};

/**
 * 获取卡片的所有标签
 */
const getCardTags = async (cardId, userId) => {
  // 验证权限
  const hasAccess = await checkCardAccess(cardId, userId);
  if (!hasAccess) {
    return null;
  }

  const query = `
    SELECT t.id, t.name, t.color, t.created_at
    FROM tags t
    JOIN card_tags ct ON t.id = ct.tag_id
    WHERE ct.card_id = $1
    ORDER BY t.name ASC
  `;
  const result = await db.query(query, [cardId]);
  return result.rows;
};

module.exports = {
  checkTagOwnership,
  getBoardTags,
  tagNameExists,
  createTag,
  updateTag,
  deleteTag,
  addTagToCard,
  removeTagFromCard,
  getCardTags,
};
