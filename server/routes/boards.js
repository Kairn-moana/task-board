const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const boardService = require("../services/boardService");
const ResponseHandler = require("../utils/responseHandler");
const { asyncHandler } = require("../utils/errorHandler");

// 所有路由都需要认证
router.use(auth);

// GET /api/boards - 获取当前登录用户的所有看板列表
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const boards = await boardService.getAllUserBoards(userId);
    return ResponseHandler.success(res, boards, "获取看板列表成功");
  })
);

// GET /api/boards/:id - 获取单个看板的详细数据（包含列表和卡片）
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const boardId = req.params.id;
    const userId = req.user.id;

    const boardDetails = await boardService.getBoardDetails(boardId, userId);
    return ResponseHandler.success(res, boardDetails, "获取看板详情成功");
  })
);

// POST /api/boards - 为当前用户创建一个新看板（包含默认列表）
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { title } = req.body;
    const userId = req.user.id;

    const newBoard = await boardService.createBoardWithDefaultLists(
      title,
      userId
    );
    return ResponseHandler.success(res, newBoard, "创建看板成功", 201);
  })
);

// PUT /api/boards/:id - 更新看板属性（标题、归档状态、背景图）
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const boardId = req.params.id;
    const userId = req.user.id;
    const updates = req.body;

    const updatedBoard = await boardService.updateBoard(
      boardId,
      userId,
      updates
    );
    return ResponseHandler.success(res, updatedBoard, "更新看板成功");
  })
);

// DELETE /api/boards/:id - 删除指定看板
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const boardId = req.params.id;
    const userId = req.user.id;

    await boardService.deleteBoard(boardId, userId);
    return ResponseHandler.success(res, null, "看板已成功删除");
  })
);

// POST /api/boards/:boardId/lists - 在指定看板下创建一个新列表
router.post(
  "/:boardId/lists",
  asyncHandler(async (req, res) => {
    const { boardId } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    const newList = await boardService.createList(boardId, title, userId);
    return ResponseHandler.success(res, newList, "创建列表成功", 201);
  })
);

// POST /api/boards/:boardId/lists/:listId/cards - 在指定列表下创建卡片
router.post(
  "/:boardId/lists/:listId/cards",
  asyncHandler(async (req, res) => {
    const { listId } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    const newCard = await boardService.createCard(listId, title, userId);
    return ResponseHandler.success(res, newCard, "创建卡片成功", 201);
  })
);

module.exports = router;
