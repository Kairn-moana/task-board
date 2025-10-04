// 负责奖励系统相关的所有数据库操作
const db = require("../db");

/**
 * 获取用户最近24小时领取的奖励ID
 */
const getRecentRedemptions = async (userId) => {
  const query = `
    SELECT reward_item_id FROM reward_redemption_logs
    WHERE user_id = $1 AND redeemed_at >= NOW() - INTERVAL '24 hours'
  `;
  const result = await db.query(query, [userId]);
  return result.rows.map((r) => r.reward_item_id);
};

/**
 * 获取可用奖励（智能推荐）
 */
const getSuggestedReward = async (userId, budget, excludeIds) => {
  let query = `
    SELECT id, title, description FROM reward_items
    WHERE user_id = $1
    AND is_enabled = TRUE
    AND (available_start_time IS NULL OR current_time BETWEEN available_start_time AND available_end_time)
  `;
  const params = [userId];

  if (budget) {
    query += ` AND budget_cost <= $${params.length + 1}`;
    params.push(budget);
  }

  if (excludeIds && excludeIds.length > 0) {
    query += ` AND id != ALL($${params.length + 1}::int[])`;
    params.push(excludeIds);
  }

  query += " ORDER BY RANDOM() LIMIT 1";

  const result = await db.query(query, params);
  return result.rows[0] || null;
};

/**
 * 获取备用奖励（忽略24小时限制）
 */
const getFallbackReward = async (userId) => {
  const query = `
    SELECT id, title, description FROM reward_items
    WHERE user_id = $1 AND is_enabled = TRUE
    ORDER BY RANDOM() LIMIT 1
  `;
  const result = await db.query(query, [userId]);
  return result.rows[0] || null;
};

/**
 * 获取用户所有奖励
 */
const getAllRewards = async (userId) => {
  const query = `
    SELECT * FROM reward_items
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;
  const result = await db.query(query, [userId]);
  return result.rows;
};

/**
 * 创建奖励
 */
const createReward = async (userId, rewardData) => {
  const {
    title,
    description,
    budget_cost,
    available_start_time,
    available_end_time,
  } = rewardData;

  const query = `
    INSERT INTO reward_items (user_id, title, description, budget_cost, available_start_time, available_end_time)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const result = await db.query(query, [
    userId,
    title,
    description,
    budget_cost,
    available_start_time || null,
    available_end_time || null,
  ]);
  return result.rows[0];
};

/**
 * 更新奖励
 */
const updateReward = async (rewardId, userId, updates) => {
  const {
    title,
    description,
    budget_cost,
    is_enabled,
    available_start_time,
    available_end_time,
  } = updates;

  const query = `
    UPDATE reward_items
    SET title = $1, description = $2, budget_cost = $3, is_enabled = $4, 
        available_start_time = $5, available_end_time = $6
    WHERE id = $7 AND user_id = $8
    RETURNING *
  `;
  const result = await db.query(query, [
    title,
    description,
    budget_cost,
    is_enabled,
    available_start_time || null,
    available_end_time || null,
    rewardId,
    userId,
  ]);
  return result.rows[0] || null;
};

/**
 * 删除奖励
 */
const deleteReward = async (rewardId, userId) => {
  const query = `
    DELETE FROM reward_items
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `;
  const result = await db.query(query, [rewardId, userId]);
  return result.rowCount > 0;
};

module.exports = {
  getRecentRedemptions,
  getSuggestedReward,
  getFallbackReward,
  getAllRewards,
  createReward,
  updateReward,
  deleteReward,
};
