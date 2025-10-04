const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const timeEntryService = require("../services/timeEntryService");
const ResponseHandler = require("../utils/responseHandler");
const { asyncHandler } = require("../utils/errorHandler");

// All routes require auth
router.use(auth);

// GET /api/time-entries/card/:cardId - 获取卡片的时间记录
router.get(
  "/card/:cardId",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { cardId } = req.params;

    const entries = await timeEntryService.getCardTimeEntries(cardId, userId);
    return ResponseHandler.success(res, entries, "获取时间记录成功");
  })
);

// POST /api/time-entries/start - 开始计时
router.post(
  "/start",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { cardId, note } = req.body;

    const timeEntry = await timeEntryService.startTimer(cardId, userId, note);
    return ResponseHandler.success(res, timeEntry, "开始计时", 201);
  })
);

// POST /api/time-entries/stop - 停止计时
router.post(
  "/stop",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { note } = req.body || {};

    const timeEntry = await timeEntryService.stopTimer(userId, note);
    return ResponseHandler.success(res, timeEntry, "停止计时");
  })
);

// GET /api/time-entries/summary/card/:cardId - 获取卡片时间统计
router.get(
  "/summary/card/:cardId",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { cardId } = req.params;

    const summary = await timeEntryService.getCardTimeSummary(cardId, userId);
    return ResponseHandler.success(res, summary, "统计成功");
  })
);

module.exports = router;

