const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const emotionService = require("../services/emotionService");
const ResponseHandler = require("../utils/responseHandler");
const { asyncHandler } = require("../utils/errorHandler");

// All emotion-related routes require authentication
router.use(auth);

/**
 * @route   GET /api/emotions/logs
 * @desc    Get all emotion logs for the user (for the diary page)
 * @access  Private
 */
router.get(
  "/logs",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const logs = await emotionService.getAllEmotionLogs(userId);
    return ResponseHandler.success(res, logs, "获取情绪日志成功");
  })
);

/**
 * @route   GET /api/emotions/logs/today
 * @desc    Get today's emotion logs
 * @access  Private
 */
router.get(
  "/logs/today",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const logs = await emotionService.getTodayEmotionLogs(userId);
    return ResponseHandler.success(res, logs, "获取今日情绪日志成功");
  })
);

/**
 * @route   POST /api/emotions/log
 * @desc    Create a new quick emotion log
 * @access  Private
 */
router.post(
  "/log",
  asyncHandler(async (req, res) => {
    const { emotion, intensity } = req.body;
    const userId = req.user.id;

    const log = await emotionService.createEmotionLog(
      userId,
      emotion,
      intensity
    );
    return ResponseHandler.success(res, log, "创建情绪记录成功", 201);
  })
);

/**
 * @route   POST /api/emotions/review
 * @desc    Save a new evening review entry
 * @access  Private
 */
router.post(
  "/review",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const reviewData = req.body;

    const review = await emotionService.createReview(userId, reviewData);
    return ResponseHandler.success(res, review, "保存晚间复盘成功", 201);
  })
);

/**
 * @route   DELETE /api/emotions/log/:id
 * @desc    Delete an emotion log (for undo functionality)
 * @access  Private
 */
router.delete(
  "/log/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    await emotionService.deleteEmotionLog(id, userId);
    return ResponseHandler.success(res, { id }, "情绪日志删除成功");
  })
);

/**
 * @route   GET /api/emotions/tags
 * @desc    获取用户的可自定义情绪标签
 * @access  Private
 */
router.get(
  "/tags",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const tags = await emotionService.getUserEmotionTags(userId);
    return ResponseHandler.success(res, tags, "获取情绪标签成功");
  })
);

/**
 * @route   POST /api/emotions/log/:id/tags
 * @desc    为一个情绪日志关联标签
 * @access  Private
 */
router.post(
  "/log/:id/tags",
  asyncHandler(async (req, res) => {
    const { id: logId } = req.params;
    const { tagId } = req.body;
    const userId = req.user.id;

    const result = await emotionService.addTagToLog(logId, tagId, userId);
    return ResponseHandler.success(res, result, "标签关联成功", 201);
  })
);

module.exports = router;
