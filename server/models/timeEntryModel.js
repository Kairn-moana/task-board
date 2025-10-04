// 负责时间记录相关的所有数据库操作
const db = require("../db");

/**
 * 检查用户是否有权访问卡片
 */
const checkCardAccess = async (cardId, userId) => {
  const query = `
    SELECT 1 FROM cards c
    JOIN lists l ON c.list_id = l.id
    JOIN boards b ON l.board_id = b.id
    WHERE c.id = $1 AND b.user_id = $2
  `;
  const result = await db.query(query, [cardId, userId]);
  return result.rowCount > 0;
};

/**
 * 获取卡片的所有时间记录
 */
const getCardTimeEntries = async (cardId) => {
  const query = `
    SELECT * FROM time_entries 
    WHERE card_id = $1 
    ORDER BY start_time DESC
  `;
  const result = await db.query(query, [cardId]);
  return result.rows;
};

/**
 * 检查用户是否有正在进行的计时
 */
const getRunningTimer = async (userId) => {
  const query = `
    SELECT * FROM time_entries 
    WHERE user_id = $1 AND end_time IS NULL 
    ORDER BY start_time DESC 
    LIMIT 1
  `;
  const result = await db.query(query, [userId]);
  return result.rows[0] || null;
};

/**
 * 开始计时
 */
const startTimer = async (cardId, userId, note) => {
  const query = `
    INSERT INTO time_entries (card_id, user_id, note) 
    VALUES ($1, $2, $3) 
    RETURNING *
  `;
  const result = await db.query(query, [cardId, userId, note || null]);
  return result.rows[0];
};

/**
 * 停止计时
 */
const stopTimer = async (timerId, note) => {
  const query = `
    UPDATE time_entries 
    SET end_time = CURRENT_TIMESTAMP, note = COALESCE($2, note) 
    WHERE id = $1 
    RETURNING *
  `;
  const result = await db.query(query, [timerId, note || null]);
  return result.rows[0];
};

/**
 * 获取卡片的时间统计
 */
const getCardTimeSummary = async (cardId) => {
  const query = `
    SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds
    FROM time_entries 
    WHERE card_id = $1 AND end_time IS NOT NULL
  `;
  const result = await db.query(query, [cardId]);
  return parseInt(result.rows[0].total_seconds);
};

module.exports = {
  checkCardAccess,
  getCardTimeEntries,
  getRunningTimer,
  startTimer,
  stopTimer,
  getCardTimeSummary,
};
