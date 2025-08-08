// API层 - 新的服务架构
import {
  boardService,
  cardService,
  attachmentService,
  tagService,
  authService,
} from "./services/index.js";

// === 向后兼容的API函数 ===
// 这些函数保持原有的接口，但内部使用新的服务架构

// --- 向后兼容的API函数 ---

export async function getBoards() {
  const result = await boardService.getBoards();
  if (!result.success) {
    throw new Error(result.message);
  }
  // 返回原始格式以保持兼容性
  return { ok: true, json: () => Promise.resolve(result.data) };
}

export async function getBoardDetails(boardId) {
  const result = await boardService.getBoardDetails(boardId);
  if (!result.success) {
    throw new Error(result.message);
  }
  return { ok: true, json: () => Promise.resolve(result.data) };
}

export async function createBoard(title) {
  const result = await boardService.createBoard(title);
  if (!result.success) {
    throw new Error(result.message);
  }
  return { ok: true, json: () => Promise.resolve(result.data) };
}

export async function createList(boardId, title) {
  const result = await boardService.createList(boardId, title);
  if (!result.success) {
    throw new Error(result.message);
  }
  return { ok: true, json: () => Promise.resolve(result.data) };
}

export async function createCard(boardId, listId, title) {
  const result = await boardService.createCard(boardId, listId, title);
  if (!result.success) {
    throw new Error(result.message);
  }
  return { ok: true, json: () => Promise.resolve(result.data) };
}

export async function updateCardsOrder(cards) {
  const result = await cardService.updateCardsOrder(cards);
  if (!result.success) {
    throw new Error(result.message);
  }
  return { ok: true, json: () => Promise.resolve(result.data) };
}

export async function updateCardDetails(cardId, updates) {
  const result = await cardService.updateCard(cardId, updates);
  if (!result.success) {
    throw new Error(result.message);
  }
  return { ok: true, json: () => Promise.resolve(result.data) };
}

// 附件相关函数
export async function saveAttachment(attachmentData) {
  const result = await attachmentService.uploadAttachment(attachmentData);
  if (!result.success) {
    throw new Error(result.message);
  }
  return { ok: true, json: () => Promise.resolve(result.data) };
}

export async function deleteAttachment(attachmentId) {
  const result = await attachmentService.deleteAttachment(attachmentId);
  if (!result.success) {
    throw new Error(result.message);
  }
  return { ok: true, json: () => Promise.resolve(result.data) };
}

// 标签相关函数
export async function getBoardTags(boardId) {
  const result = await tagService.getBoardTags(boardId);
  if (!result.success) {
    throw new Error(result.message);
  }
  return { ok: true, json: () => Promise.resolve(result.data) };
}

export async function createTag(tagData) {
  const result = await tagService.createTag(tagData);
  if (!result.success) {
    throw new Error(result.message);
  }
  return { ok: true, json: () => Promise.resolve(result.data) };
}

export async function updateTag(tagId, tagData) {
  const result = await tagService.updateTag(tagId, tagData);
  if (!result.success) {
    throw new Error(result.message);
  }
  return { ok: true, json: () => Promise.resolve(result.data) };
}

export async function deleteTag(tagId) {
  const result = await tagService.deleteTag(tagId);
  if (!result.success) {
    throw new Error(result.message);
  }
  return { ok: true, json: () => Promise.resolve(result.data) };
}

export async function addTagToCard(cardId, tagId) {
  const result = await tagService.addTagToCard(cardId, tagId);
  if (!result.success) {
    throw new Error(result.message);
  }
  return { ok: true, json: () => Promise.resolve(result.data) };
}

export async function removeTagFromCard(cardId, tagId) {
  const result = await tagService.removeTagFromCard(cardId, tagId);
  if (!result.success) {
    throw new Error(result.message);
  }
  return { ok: true, json: () => Promise.resolve(result.data) };
}

export async function getCardTags(cardId) {
  const result = await tagService.getCardTags(cardId);
  if (!result.success) {
    throw new Error(result.message);
  }
  return { ok: true, json: () => Promise.resolve(result.data) };
}

export async function deleteCardAPI(cardId) {
  const result = await cardService.deleteCard(cardId);
  if (!result.success) {
    throw new Error(result.message);
  }
  return { ok: true, json: () => Promise.resolve(result.data) };
}

// 认证相关函数
export async function loginUser(username, password) {
  const data = await authService.login(username, password);
  return { ok: true, json: () => Promise.resolve(data) };
}

export async function registerUser(username, password) {
  const data = await authService.register(username, password);
  return { ok: true, json: () => Promise.resolve(data) };
}
