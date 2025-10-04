// 负责看板相关的所有数据库操作
const db = require("../db");

/**
 * 检查用户是否有权访问指定看板
 */
const checkBoardOwnership = async (boardId, userId) => {
  const query = `
    SELECT id FROM boards 
    WHERE id = $1 AND user_id = $2
  `;
  const result = await db.query(query, [boardId, userId]);
  return result.rowCount > 0;
};

/**
 * 获取用户的所有看板
 */
const getAllUserBoards = async (userId) => {
  const query = `
    SELECT * FROM boards 
    WHERE user_id = $1 AND is_archived = FALSE 
    ORDER BY id ASC
  `;
  const result = await db.query(query, [userId]);
  return result.rows;
};

/**
 * 根据ID获取看板基本信息
 */
const getBoardById = async (boardId, userId) => {
  const query = `
    SELECT * FROM boards 
    WHERE id = $1 AND user_id = $2
  `;
  const result = await db.query(query, [boardId, userId]);
  return result.rows[0] || null;
};

/**
 * 获取看板的详细信息（包含列表、卡片、附件、标签）
 */
const getBoardDetails = async (boardId, userId) => {
  // 1. 验证权限并获取看板信息
  const boardInfo = await getBoardById(boardId, userId);
  if (!boardInfo) {
    return null;
  }

  // 2. 获取该看板下的所有列表
  const listsQuery = `
    SELECT * FROM lists 
    WHERE board_id = $1 
    ORDER BY "order" ASC
  `;
  const listsResult = await db.query(listsQuery, [boardId]);
  const lists = listsResult.rows;

  // 3. 获取该看板下的所有卡片（包含附件、标签、子任务）
  const cardsQuery = `
    SELECT 
      c.*,
      COALESCE(
        (SELECT JSON_AGG(att.* ORDER BY att.uploaded_at) 
         FROM attachments att 
         WHERE att.card_id = c.id),
        '[]'::json
      ) as attachments,
      COALESCE(
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', t.id,
            'name', t.name,
            'color', t.color
          ) ORDER BY t.name
        ) 
         FROM tags t 
         JOIN card_tags ct ON t.id = ct.tag_id
         WHERE ct.card_id = c.id),
        '[]'::json
      ) as tags,
      COALESCE(
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', s.id,
            'title', s.title,
            'is_completed', s.is_completed,
            'order', s."order"
          ) ORDER BY s."order" ASC
        ) 
         FROM subtasks s 
         WHERE s.card_id = c.id),
        '[]'::json
      ) as subtasks
    FROM cards c 
    JOIN lists l ON c.list_id = l.id
    WHERE l.board_id = $1 
    ORDER BY c."order" ASC
  `;
  const cardsResult = await db.query(cardsQuery, [boardId]);
  const cards = cardsResult.rows;

  // 4. 将卡片组合到对应的列表中
  const listsWithCards = lists.map((list) => ({
    ...list,
    cards: cards.filter((card) => card.list_id === list.id),
  }));

  return {
    ...boardInfo,
    lists: listsWithCards,
  };
};

/**
 * 创建新看板
 */
const createBoard = async (title, userId) => {
  const query = `
    INSERT INTO boards (title, user_id) 
    VALUES ($1, $2) 
    RETURNING *
  `;
  const result = await db.query(query, [title, userId]);
  return result.rows[0];
};

/**
 * 为看板创建默认列表
 */
const createDefaultLists = async (boardId, client) => {
  const defaultLists = [
    { title: "待办事项", order: 0 },
    { title: "进行中", order: 1 },
    { title: "已完成", order: 2 },
  ];

  for (const list of defaultLists) {
    await client.query(
      'INSERT INTO lists (title, "order", board_id) VALUES ($1, $2, $3)',
      [list.title, list.order, boardId]
    );
  }
};

/**
 * 更新看板信息
 */
const updateBoard = async (boardId, userId, updates) => {
  const { title, is_archived, background_image_url } = updates;

  const currentBoard = await getBoardById(boardId, userId);
  if (!currentBoard) {
    return null;
  }

  const newTitle = title !== undefined ? title.trim() : currentBoard.title;
  const newArchivedState =
    is_archived !== undefined ? is_archived : currentBoard.is_archived;
  const newBackground =
    background_image_url !== undefined
      ? background_image_url
      : currentBoard.background_image_url;

  const query = `
    UPDATE boards 
    SET title = $1, is_archived = $2, background_image_url = $3 
    WHERE id = $4 
    RETURNING *
  `;
  const result = await db.query(query, [
    newTitle,
    newArchivedState,
    newBackground,
    boardId,
  ]);
  return result.rows[0];
};

/**
 * 删除看板
 */
const deleteBoard = async (boardId, userId) => {
  const query = `
    DELETE FROM boards 
    WHERE id = $1 AND user_id = $2 
    RETURNING *
  `;
  const result = await db.query(query, [boardId, userId]);
  return result.rowCount > 0;
};

/**
 * 在看板下创建列表
 */
const createList = async (boardId, title, userId) => {
  // 验证权限
  const hasAccess = await checkBoardOwnership(boardId, userId);
  if (!hasAccess) {
    return null;
  }

  // 计算新列表的order
  const orderQuery = `
    SELECT COUNT(*) FROM lists 
    WHERE board_id = $1
  `;
  const orderResult = await db.query(orderQuery, [boardId]);
  const newOrder = parseInt(orderResult.rows[0].count);

  // 创建列表
  const insertQuery = `
    INSERT INTO lists (title, "order", board_id) 
    VALUES ($1, $2, $3) 
    RETURNING *
  `;
  const result = await db.query(insertQuery, [title, newOrder, boardId]);
  return result.rows[0];
};

/**
 * 在列表下创建卡片
 */
const createCard = async (listId, title, userId) => {
  // 验证用户有权访问这个列表
  const listAccessQuery = `
    SELECT l.id FROM lists l 
    JOIN boards b ON l.board_id = b.id
    WHERE l.id = $1 AND b.user_id = $2
  `;
  const listAccessResult = await db.query(listAccessQuery, [listId, userId]);
  if (listAccessResult.rowCount === 0) {
    return null;
  }

  // 计算新卡片的order
  const orderQuery = `
    SELECT COUNT(*) FROM cards 
    WHERE list_id = $1
  `;
  const orderResult = await db.query(orderQuery, [listId]);
  const newOrder = parseInt(orderResult.rows[0].count);

  // 创建卡片
  const insertQuery = `
    INSERT INTO cards (title, "order", list_id) 
    VALUES ($1, $2, $3) 
    RETURNING *
  `;
  const result = await db.query(insertQuery, [title, newOrder, listId]);
  return result.rows[0];
};

module.exports = {
  checkBoardOwnership,
  getAllUserBoards,
  getBoardById,
  getBoardDetails,
  createBoard,
  createDefaultLists,
  updateBoard,
  deleteBoard,
  createList,
  createCard,
};
