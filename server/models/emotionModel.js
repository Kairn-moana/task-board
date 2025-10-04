// 负责情绪日志相关的所有数据库操作
const db = require("../db");

/**
 * 获取用户的所有情绪日志（包含标签）
 */
const getAllEmotionLogs = async (userId) => {
  const query = `
    SELECT
      el.id,
      el.emotion,
      el.intensity,
      el.created_at,
      el.notes,
      COALESCE(
        (SELECT json_agg(json_build_object('id', et.id, 'name', et.name))
         FROM emotion_log_tags elt
         JOIN emotion_tags et ON elt.tag_id = et.id
         WHERE elt.log_id = el.id),
        '[]'::json
      ) AS tags
    FROM emotion_logs el
    WHERE el.user_id = $1
    ORDER BY el.created_at DESC
  `;
  const result = await db.query(query, [userId]);
  return result.rows;
};

/**
 * 获取今日的情绪日志
 */
const getTodayEmotionLogs = async (userId) => {
  const query = `
    SELECT
      el.id,
      el.emotion,
      el.intensity,
      el.created_at,
      el.notes,
      COALESCE(
        (SELECT json_agg(
          json_build_object('id', et.id, 'name', et.name)
        )
        FROM emotion_log_tags elt
        JOIN emotion_tags et ON elt.tag_id = et.id
        WHERE elt.log_id = el.id),
        '[]'::json
      ) AS tags
    FROM emotion_logs el
    WHERE el.user_id = $1 AND el.created_at >= current_date
    ORDER BY el.created_at DESC
  `;
  const result = await db.query(query, [userId]);
  return result.rows;
};

/**
 * 创建快速情绪记录
 */
const createEmotionLog = async (userId, emotion, intensity) => {
  const query = `
    INSERT INTO emotion_logs (user_id, emotion, intensity)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await db.query(query, [userId, emotion, intensity]);
  return result.rows[0];
};

/**
 * 创建晚间复盘记录
 */
const createReview = async (userId, notes) => {
  const query = `
    INSERT INTO emotion_logs (user_id, emotion, notes)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  // 使用特殊 emoji '📝' 标识复盘记录
  const result = await db.query(query, [userId, "📝", notes]);
  return result.rows[0];
};

/**
 * 删除情绪日志（需验证所有权）
 */
const deleteEmotionLog = async (logId, userId) => {
  const query = `
    DELETE FROM emotion_logs
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `;
  const result = await db.query(query, [logId, userId]);
  return result.rowCount > 0;
};

/**
 * 检查日志是否属于用户
 */
const checkLogOwnership = async (logId, userId) => {
  const query = `
    SELECT id FROM emotion_logs 
    WHERE id = $1 AND user_id = $2
  `;
  const result = await db.query(query, [logId, userId]);
  return result.rowCount > 0;
};

/**
 * 获取用户的情绪标签
 */
const getUserEmotionTags = async (userId) => {
  const query = `
    SELECT id, name FROM emotion_tags
    WHERE user_id = $1
    ORDER BY sort_order ASC
  `;
  const result = await db.query(query, [userId]);
  return result.rows;
};

/**
 * 为情绪日志添加标签
 */
const addTagToLog = async (logId, tagId) => {
  const query = `
    INSERT INTO emotion_log_tags (log_id, tag_id)
    VALUES ($1, $2)
    ON CONFLICT (log_id, tag_id) DO NOTHING
    RETURNING *
  `;
  const result = await db.query(query, [logId, tagId]);
  return result.rows[0] || null;
};

module.exports = {
  getAllEmotionLogs,
  getTodayEmotionLogs,
  createEmotionLog,
  createReview,
  deleteEmotionLog,
  checkLogOwnership,
  getUserEmotionTags,
  addTagToLog,
};
