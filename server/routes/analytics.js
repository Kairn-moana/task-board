const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/authMiddleware");
const ResponseHandler = require("../utils/responseHandler");
const { asyncHandler } = require("../utils/errorHandler");

// 所有分析相关的操作都需要先登录
router.use(auth);

/**
 * @route   GET /api/analytics/monthly-summary
 * @desc    Get a summary card for a specific month
 * @access  Private
 */
router.get(
  "/monthly-summary",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { year, month } = req.query;

    if (!year || !month) {
      return ResponseHandler.badRequest(res, "Year and month are required.");
    }

    // --- 1. Top 3 Common Emotions ---
    const topEmotionsQuery = `
    SELECT emotion, COUNT(*) as count
    FROM emotion_logs
    WHERE user_id = $1 AND EXTRACT(YEAR FROM created_at) = $2 AND EXTRACT(MONTH FROM created_at) = $3
    GROUP BY emotion
    ORDER BY count DESC
    LIMIT 3;
  `;
    const topEmotionsResult = await db.query(topEmotionsQuery, [
      userId,
      year,
      month,
    ]);
    const topEmotions = topEmotionsResult.rows;

    // --- 2. High-Frequency Scene Tags ---
    const topTagsQuery = `
    SELECT t.name, COUNT(*) as count
    FROM emotion_log_tags lt
    JOIN emotion_tags t ON lt.tag_id = t.id
    JOIN emotion_logs l ON lt.log_id = l.id
    WHERE l.user_id = $1 AND EXTRACT(YEAR FROM l.created_at) = $2 AND EXTRACT(MONTH FROM l.created_at) = $3
    GROUP BY t.name
    ORDER BY count DESC
    LIMIT 3;
  `;
    const topTagsResult = await db.query(topTagsQuery, [userId, year, month]);
    const topTags = topTagsResult.rows;

    // --- 3. Most Improved Week (Complex Logic) ---
    const weeklyImprovement = "数据分析中...";

    // --- 4. Gentle Suggestions (Complex Logic) ---
    const suggestions = "根据您的记录，我们发现了一些有趣的模式...";

    return ResponseHandler.success(
      res,
      {
        year,
        month,
        topEmotions,
        topTags,
        mostImprovedWeek: weeklyImprovement,
        gentleSuggestion: suggestions,
      },
      "获取月度总结成功"
    );
  })
);

// 获取最近N天的分析数据
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;

    const query = `
    SELECT 
      to_char(metric_date, 'YYYY-MM-DD') as date,
      tasks_completed,
      emotion_calm,
      emotion_anxious,
      emotion_tense,
      emotion_happy
    FROM daily_metrics
    WHERE user_id = $1 AND metric_date >= current_date - interval '1 day' * $2
    ORDER BY metric_date ASC;
  `;
    const result = await db.query(query, [userId, days]);
    return ResponseHandler.success(res, result.rows, "获取分析数据成功");
  })
);

router.get(
  "/emotion-timeline",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const query = `
    SELECT
      cl.id,
      cl.completed_at,
      cl.emotion,
      c.title AS card_title,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object('id', t.id, 'name', t.name, 'color', t.color)
          )
          FROM tags t
          JOIN card_tags ct ON t.id = ct.tag_id
          WHERE ct.card_id = c.id
        ),
        '[]'::json
      ) AS tags
    FROM completion_logs cl
    JOIN cards c ON cl.card_id = c.id
    WHERE cl.user_id = $1
    ORDER BY cl.completed_at DESC;
  `;

    const result = await db.query(query, [userId]);
    return ResponseHandler.success(res, result.rows, "获取情绪时间线成功");
  })
);

/**
 * @route   GET /api/analytics/recommend-tasks
 * @desc    根据当前情绪推荐任务
 * @access  Private
 */
router.get(
  "/recommend-tasks",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { emotion } = req.query;

    if (!emotion) {
      return ResponseHandler.badRequest(res, "缺少当前情绪参数 (emotion)");
    }

    // 步骤 1: 分析历史，找出在该情绪下完成任务最多的标签
    const favoriteTagsQuery = `
    SELECT t.id FROM completion_logs cl
    JOIN card_tags ct ON cl.card_id = ct.card_id
    JOIN tags t ON ct.tag_id = t.id
    WHERE cl.user_id = $1 AND cl.emotion = $2
    GROUP BY t.id
    ORDER BY COUNT(t.id) DESC
    LIMIT 5;
  `;
    const favoriteTagsResult = await db.query(favoriteTagsQuery, [
      userId,
      emotion,
    ]);
    const favoriteTagIds = favoriteTagsResult.rows.map((tag) => tag.id);

    // 步骤 2 & 3: 从"未完成"任务中，筛选出包含这些"高效标签"的任务
    let recommendedTasks = [];
    if (favoriteTagIds.length > 0) {
      const recommendationQuery = `
      SELECT c.id, c.title, c.priority, c.estimated_seconds,
        COALESCE(
          (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color) ORDER BY t.name)
           FROM tags t JOIN card_tags ct ON t.id = ct.tag_id WHERE ct.card_id = c.id),
          '[]'::json
        ) AS tags
      FROM cards c
      JOIN lists l ON c.list_id = l.id
      JOIN boards b ON l.board_id = b.id
      WHERE b.user_id = $1 AND c.status != 'Done' AND EXISTS (
        SELECT 1 FROM card_tags ct WHERE ct.card_id = c.id AND ct.tag_id = ANY($2::int[])
      )
      ORDER BY c.estimated_seconds ASC, c.priority DESC
      LIMIT 3;
    `;
      const recommendationResult = await db.query(recommendationQuery, [
        userId,
        favoriteTagIds,
      ]);
      recommendedTasks = recommendationResult.rows;
    }

    // 步骤 4 (备用策略): 如果根据标签找不到任务或数量不足，则补充最简单的任务
    if (recommendedTasks.length < 3) {
      const existingIds = recommendedTasks.map((t) => t.id);
      const needed = 3 - recommendedTasks.length;

      const fallbackQuery = `
      SELECT c.id, c.title, c.priority, c.estimated_seconds,
        COALESCE(
          (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color) ORDER BY t.name)
           FROM tags t JOIN card_tags ct ON t.id = ct.tag_id WHERE ct.card_id = c.id),
          '[]'::json
        ) AS tags
      FROM cards c
      JOIN lists l ON c.list_id = l.id
      JOIN boards b ON l.board_id = b.id
      WHERE b.user_id = $1 AND c.status != 'Done' AND c.id != ALL($2::int[])
      ORDER BY c.estimated_seconds ASC, c.priority DESC
      LIMIT $3;
    `;
      const fallbackResult = await db.query(fallbackQuery, [
        userId,
        existingIds,
        needed,
      ]);
      recommendedTasks.push(...fallbackResult.rows);
    }

    return ResponseHandler.success(res, recommendedTasks, "获取任务推荐成功");
  })
);

// 新增：专注会话热力图（近 N 天，按小时聚合）
router.get(
  "/focus-heatmap",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;

    const query = `
    SELECT
      to_char(start_time, 'YYYY-MM-DD') AS date,
      EXTRACT(HOUR FROM start_time)::int AS hour,
      COUNT(*) AS sessions,
      COUNT(*) FILTER (WHERE duration_seconds >= 300) AS effective_sessions
    FROM time_entries
    WHERE user_id = $1
      AND start_time >= current_timestamp - interval '1 day' * $2
    GROUP BY date, hour
    ORDER BY date, hour
  `;
    const result = await db.query(query, [userId, days]);
    return ResponseHandler.success(res, result.rows, "获取专注会话热力图成功");
  })
);

/**
 * @route   GET /api/analytics/summary?days=7
 * @desc    每日小结与7天迷你趋势 + 黄金起步时段Top2
 * @access  Private
 */
router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const days = Math.max(1, parseInt(req.query.days) || 7);

    // 首先检查必要的表是否存在
    const tableCheckQuery = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'time_entries'
    ) as time_entries_exists,
    EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'completion_logs'
    ) as completion_logs_exists;
  `;

    const tableCheck = await db.query(tableCheckQuery);
    const { time_entries_exists, completion_logs_exists } = tableCheck.rows[0];

    if (!time_entries_exists || !completion_logs_exists) {
      return ResponseHandler.error(res, "数据库表未正确创建", 500, {
        time_entries_exists,
        completion_logs_exists,
        message: "请运行数据库迁移脚本来创建缺少的表",
      });
    }

    // 生成最近N天日期
    const seriesQuery = `
  WITH days AS (
    SELECT generate_series(current_date - ($2::int - 1), current_date, interval '1 day')::date AS day
  ),
  starts AS (
    SELECT date_trunc('day', start_time)::date AS day,
           COUNT(*)::int AS starts,
           COALESCE(SUM(duration_seconds),0)::int AS seconds
    FROM time_entries
    WHERE user_id = $1
      AND start_time >= current_date - interval '1 day' * ($2::int - 1)
    GROUP BY 1
  ),
  done AS (
    SELECT date_trunc('day', completed_at)::date AS day,
           COUNT(*)::int AS done
    FROM completion_logs
    WHERE user_id = $1
      AND completed_at >= current_date - interval '1 day' * ($2::int - 1)
    GROUP BY 1
  )
  SELECT d.day,
         COALESCE(s.starts, 0) AS starts,
         COALESCE((s.seconds/60), 0) AS minutes,
         COALESCE(done_table.done, 0) AS done
  FROM days d
  LEFT JOIN starts s ON s.day = d.day
  LEFT JOIN done done_table ON done_table.day = d.day
  ORDER BY d.day ASC;
`;
    const seriesResult = await db.query(seriesQuery, [userId, days]);

    // 今日合计
    let todayStarts = 0,
      todayMinutes = 0,
      todayDone = 0;
    const daysArr = [],
      startsArr = [],
      minutesArr = [],
      doneArr = [];
    seriesResult.rows.forEach((r) => {
      const d = r.day.toISOString().slice(0, 10);
      daysArr.push(d);
      startsArr.push(Number(r.starts));
      minutesArr.push(Number(r.minutes));
      doneArr.push(Number(r.done));
      if (d === new Date().toISOString().slice(0, 10)) {
        todayStarts = Number(r.starts);
        todayMinutes = Number(r.minutes);
        todayDone = Number(r.done);
      }
    });

    // 黄金起步时段（近30天，按"每日首次完成"小时统计Top2）
    const goldenQuery = `
    WITH firsts AS (
      SELECT date_trunc('day', completed_at)::date AS day,
             MIN(completed_at) AS first_at
      FROM completion_logs
      WHERE user_id = $1
        AND completed_at >= current_date - interval '30 days'
      GROUP BY 1
    )
    SELECT EXTRACT(HOUR FROM first_at)::int AS hour,
           COUNT(*)::int AS cnt
    FROM firsts
    GROUP BY 1
    ORDER BY cnt DESC, hour ASC
    LIMIT 2;
  `;
    const goldenResult = await db.query(goldenQuery, [userId]);
    const goldenHours = goldenResult.rows.map((r) => Number(r.hour));

    return ResponseHandler.success(
      res,
      {
        today: { starts: todayStarts, minutes: todayMinutes, done: todayDone },
        series: {
          days: daysArr,
          starts: startsArr,
          minutes: minutesArr,
          done: doneArr,
        },
        golden_hours: goldenHours,
      },
      "获取每日总结成功"
    );
  })
);

module.exports = router;
