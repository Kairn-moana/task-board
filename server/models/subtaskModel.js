const db = require("../db");

/**
 * 同步一个卡片的所有子任务
 * @param {number} cardId 卡片ID
 * @param {Array<object>} subtasks 前端传来的子任务数组，每个对象可能包含 id, title, is_completed
 * @returns {Promise<Array<object>>} 返回同步后该卡片的所有子任务
 */
const syncSubtasks = async (cardId, subtasks) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    // 1. 获取数据库中现有的子任务ID
    const existingSubtasksResult = await client.query(
      "SELECT id FROM subtasks WHERE card_id = $1",
      [cardId]
    );
    const existingSubtaskIds = new Set(
      existingSubtasksResult.rows.map((r) => r.id)
    );

    const incomingSubtaskIds = new Set(
      subtasks.filter((s) => s.id).map((s) => s.id)
    );

    // 2. 找出需要删除的子任务
    const idsToDelete = [...existingSubtaskIds].filter(
      (id) => !incomingSubtaskIds.has(id)
    );
    if (idsToDelete.length > 0) {
      await client.query("DELETE FROM subtasks WHERE id = ANY($1::int[])", [
        idsToDelete,
      ]);
    }

    // 3. 遍历前端传来的子任务，进行更新或插入
    for (const [index, subtask] of subtasks.entries()) {
      const isCompleted = subtask.is_completed === true;

      if (subtask.id && existingSubtaskIds.has(subtask.id)) {
        // 更新现有子任务
        await client.query(
          `UPDATE subtasks SET title = $1, is_completed = $2, "order" = $3 WHERE id = $4`,
          [subtask.title, isCompleted, index, subtask.id]
        );
      } else {
        // 插入新子任务
        await client.query(
          `INSERT INTO subtasks (card_id, title, is_completed, "order") VALUES ($1, $2, $3, $4)`,
          [cardId, subtask.title, isCompleted || false, index]
        );
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("同步子任务时出错:", error);
    throw error; // 向上抛出错误，让路由处理器捕获
  } finally {
    client.release();
  }

  // 返回最新的完整子任务列表
  const finalSubtasksResult = await db.query(
    'SELECT * FROM subtasks WHERE card_id = $1 ORDER BY "order" ASC',
    [cardId]
  );
  return finalSubtasksResult.rows;
};

module.exports = {
  syncSubtasks,
};
