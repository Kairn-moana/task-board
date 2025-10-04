/**
 * 标签业务逻辑层
 */

const tagModel = require("../models/tagModel");
const { AppError } = require("../utils/errorHandler");

// 颜色格式验证
const isValidColor = (color) => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

/**
 * 获取看板的所有标签
 */
const getBoardTags = async (boardId, userId) => {
  const tags = await tagModel.getBoardTags(boardId, userId);
  if (tags === null) {
    throw new AppError("无权访问此看板", 403);
  }
  return tags;
};

/**
 * 创建新标签
 */
const createTag = async (name, color, boardId, userId) => {
  // 参数验证
  if (!name || !color || !boardId) {
    throw new AppError("标签名称、颜色和看板ID都是必需的", 400);
  }

  if (!isValidColor(color)) {
    throw new AppError("颜色格式无效，应为 #RRGGBB 格式", 400);
  }

  // 检查标签名是否已存在
  const exists = await tagModel.tagNameExists(name, boardId);
  if (exists) {
    throw new AppError("标签名已存在", 400);
  }

  const newTag = await tagModel.createTag(name, color, boardId, userId);
  if (!newTag) {
    throw new AppError("无权在此看板下创建标签", 403);
  }

  return newTag;
};

/**
 * 更新标签
 */
const updateTag = async (tagId, name, color, userId) => {
  // 参数验证
  if (!name || !color) {
    throw new AppError("标签名称和颜色都是必需的", 400);
  }

  if (!isValidColor(color)) {
    throw new AppError("颜色格式无效，应为 #RRGGBB 格式", 400);
  }

  const updatedTag = await tagModel.updateTag(tagId, name, color, userId);
  if (!updatedTag) {
    throw new AppError("无权修改此标签或标签不存在", 403);
  }

  return updatedTag;
};

/**
 * 删除标签
 */
const deleteTag = async (tagId, userId) => {
  const deletedTag = await tagModel.deleteTag(tagId, userId);
  if (!deletedTag) {
    throw new AppError("无权删除此标签或标签不存在", 403);
  }
  return deletedTag;
};

/**
 * 为卡片添加标签
 */
const addTagToCard = async (cardId, tagId, userId) => {
  if (!tagId) {
    throw new AppError("标签ID是必需的", 400);
  }

  const result = await tagModel.addTagToCard(cardId, tagId, userId);

  if (!result.success) {
    switch (result.error) {
      case "NO_ACCESS":
        throw new AppError("无权修改此卡片", 403);
      case "NOT_SAME_BOARD":
        throw new AppError("标签不存在或不属于同一看板", 400);
      case "ALREADY_EXISTS":
        throw new AppError("标签已经存在于此卡片", 400);
      default:
        throw new AppError("添加标签失败", 500);
    }
  }

  return result.data;
};

/**
 * 从卡片移除标签
 */
const removeTagFromCard = async (cardId, tagId, userId) => {
  const removed = await tagModel.removeTagFromCard(cardId, tagId, userId);
  if (!removed) {
    throw new AppError("无权修改此卡片或标签关联不存在", 403);
  }
  return true;
};

/**
 * 获取卡片的所有标签
 */
const getCardTags = async (cardId, userId) => {
  const tags = await tagModel.getCardTags(cardId, userId);
  if (tags === null) {
    throw new AppError("无权访问此卡片", 403);
  }
  return tags;
};

module.exports = {
  getBoardTags,
  createTag,
  updateTag,
  deleteTag,
  addTagToCard,
  removeTagFromCard,
  getCardTags,
};
