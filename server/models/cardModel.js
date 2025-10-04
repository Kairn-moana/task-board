// 负责所有数据库交互--与卡片相关的数据库查询逻辑
const db = require("../db");

/**
 * 检查卡片是否属于指定用户
 * @param {number} cardId - 卡片ID
 * @param {number} userId - 用户ID
 * @returns {Promise<boolean>} - 如果卡片属于用户，则返回 true
 */
const checkCardOwnership = async (cardId, userId) => {
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
 * 获取用户的所有卡片
 * @param {number} userId - 用户ID
 * @returns {Promise<Array>} - 返回卡片数组
 */
const getAllUserCards = async (userId) => {
  const query = `
    SELECT c.* FROM cards c
    JOIN lists l ON c.list_id = l.id
    JOIN boards b ON l.board_id = b.id
    WHERE b.user_id = $1
    ORDER BY c.id;
  `;
  const result = await db.query(query, [userId]);
  return result.rows;
};

/**
 * 获取单个卡片的详细信息，包括附件和标签
 * @param {number} cardId - 卡片ID
 * @returns {Promise<object|null>} - 返回卡片对象或 null
 */
const getCardDetailsById = async (cardId) => {
  const query = `
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
    WHERE c.id = $1
  `;
  const result = await db.query(query, [cardId]);
  return result.rows[0] || null;
};

/**
 * 更新卡片信息
 * @param {number} cardId - 卡片ID
 * @param {object} updates - 要更新的字段和值
 * @returns {Promise<object>} - 返回更新后的卡片对象
 */
const updateCard = async (cardId, updates) => {
  const updateFields = [];
  const values = [];
  let queryIndex = 1;

  for (const key in updates) {
    if (updates[key] !== undefined) {
      updateFields.push(`${key} = $${queryIndex++}`);
      values.push(updates[key]);
    }
  }

  if (updateFields.length === 0) {
    return getCardDetailsById(cardId); // 没有更新，直接返回当前卡片信息
  }

  values.push(cardId);
  const updateQuery = `
    UPDATE cards 
    SET ${updateFields.join(", ")} 
    WHERE id = $${queryIndex} 
    RETURNING *
  `;

  await db.query(updateQuery, values);
  return getCardDetailsById(cardId); // 返回包含附件和标签的完整信息
};

/**
 * 删除卡片
 * @param {number} cardId - 卡片ID
 * @returns {Promise<boolean>} - 返回是否删除成功
 */
const deleteCard = async (cardId) => {
  const deleteQuery = `DELETE FROM cards WHERE id = $1`;
  const result = await db.query(deleteQuery, [cardId]);
  return result.rowCount > 0;
};

/**
 * 批量更新卡片顺序（事务处理）
 * @param {Array} cards - 卡片数组，包含 id, order, list_id
 * @param {number} userId - 用户ID（用于权限验证）
 * @returns {Promise<void>}
 */
const updateCardsOrder = async (cards, userId) => {
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    // 安全性检查：验证所有卡片都属于当前用户
    const cardIds = cards.map((c) => c.id);
    const authQuery = `
      SELECT c.id FROM cards c
      JOIN lists l ON c.list_id = l.id
      JOIN boards b ON l.board_id = b.id
      WHERE b.user_id = $1 AND c.id = ANY($2::int[])
    `;
    const authResult = await client.query(authQuery, [userId, cardIds]);

    if (authResult.rowCount !== cardIds.length) {
      await client.query("ROLLBACK");
      throw new Error("权限错误：部分卡片不属于当前用户");
    }

    // 遍历并更新每张卡片
    for (const card of cards) {
      const updateQuery = `
        UPDATE cards 
        SET "order" = $1, list_id = $2 
        WHERE id = $3
      `;
      await client.query(updateQuery, [card.order, card.list_id, card.id]);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/**
 * 记录卡片完成日志
 * @param {number} userId - 用户ID
 * @param {number} cardId - 卡片ID
 * @param {string} emotion - 完成时的情绪
 */
const logCompletion = async (userId, cardId, emotion) => {
  try {
    const logQuery = `
      INSERT INTO completion_logs (user_id, card_id, emotion)
      VALUES ($1, $2, $3)
    `;
    await db.query(logQuery, [userId, cardId, emotion]);
  } catch (logError) {
    // 如果日志记录失败，我们不应该中断整个请求，
    // 但应该在服务器上记录这个错误，以便后续排查。
    console.error(`为卡片 ${cardId} 记录完成日志时失败:`, logError);
  }
};

module.exports = {
  checkCardOwnership,
  getAllUserCards,
  getCardDetailsById,
  updateCard,
  deleteCard,
  updateCardsOrder,
  logCompletion,
};
