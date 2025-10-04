// 专门负责权限校验
const cardModel = require("../models/cardModel");
const ResponseHandler = require("../utils/responseHandler");

const canAccessCard = async (req, res, next) => {
  try {
    const cardId = req.params.id || req.params.cardId;
    const userId = req.user.id;

    if (!cardId || !userId) {
      return ResponseHandler.badRequest(res, "缺少卡片ID或用户信息");
    }

    const hasAccess = await cardModel.checkCardOwnership(cardId, userId);

    if (!hasAccess) {
      return ResponseHandler.forbidden(res, "无权访问此卡片");
    }

    next();
  } catch (error) {
    console.error("卡片权限校验出错:", error);
    return ResponseHandler.error(res, "服务器内部错误", 500);
  }
};

module.exports = {
  canAccessCard,
};
