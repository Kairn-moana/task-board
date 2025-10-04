/**
 * 看板业务逻辑层
 */

const db = require("../db");
const boardModel = require("../models/boardModel");
const { AppError } = require("../utils/errorHandler");

/**
 * 获取用户的所有看板
 */
const getAllUserBoards = async (userId) => {
  return boardModel.getAllUserBoards(userId);
};

/**
 * 获取看板详情
 */
const getBoardDetails = async (boardId, userId) => {
  const boardDetails = await boardModel.getBoardDetails(boardId, userId);
  if (!boardDetails) {
    throw new AppError("无权访问此看板或看板不存在", 403);
  }
  return boardDetails;
};

/**
 * 创建新看板（包含默认列表）
 */
const createBoardWithDefaultLists = async (title, userId) => {
  if (!title || title.trim() === "") {
    throw new AppError("看板标题不能为空", 400);
  }

  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    // 创建看板
    const boardQuery = `
      INSERT INTO boards (title, user_id) 
      VALUES ($1, $2) 
      RETURNING *
    `;
    const boardResult = await client.query(boardQuery, [title.trim(), userId]);
    const newBoard = boardResult.rows[0];

    // 创建默认列表
    await boardModel.createDefaultLists(newBoard.id, client);

    await client.query("COMMIT");
    return newBoard;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/**
 * 更新看板
 */
const updateBoard = async (boardId, userId, updates) => {
  if (updates.title !== undefined && updates.title.trim() === "") {
    throw new AppError("标题不能为空", 400);
  }

  const updatedBoard = await boardModel.updateBoard(boardId, userId, updates);
  if (!updatedBoard) {
    throw new AppError("无权修改此看板或看板不存在", 403);
  }
  return updatedBoard;
};

/**
 * 删除看板
 */
const deleteBoard = async (boardId, userId) => {
  const deleted = await boardModel.deleteBoard(boardId, userId);
  if (!deleted) {
    throw new AppError("无权删除此看板或看板不存在", 403);
  }
  return true;
};

/**
 * 在看板下创建列表
 */
const createList = async (boardId, title, userId) => {
  if (!title || title.trim() === "") {
    throw new AppError("列表标题不能为空", 400);
  }

  const newList = await boardModel.createList(boardId, title.trim(), userId);
  if (!newList) {
    throw new AppError("无权在此看板下创建列表", 403);
  }
  return newList;
};

/**
 * 在列表下创建卡片
 */
const createCard = async (listId, title, userId) => {
  if (!title || title.trim() === "") {
    throw new AppError("卡片标题不能为空", 400);
  }

  const newCard = await boardModel.createCard(listId, title.trim(), userId);
  if (!newCard) {
    throw new AppError("无权在此列表下创建卡片", 403);
  }
  return newCard;
};

module.exports = {
  getAllUserBoards,
  getBoardDetails,
  createBoardWithDefaultLists,
  updateBoard,
  deleteBoard,
  createList,
  createCard,
};
