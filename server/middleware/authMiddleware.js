const jwt = require("jsonwebtoken");
const ResponseHandler = require("../utils/responseHandler");
const { AppError } = require("../utils/errorHandler");
require("dotenv").config();

module.exports = function (req, res, next) {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return ResponseHandler.unauthorizedError(res, "没有提供Token或格式错误");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return ResponseHandler.unauthorizedError(res, "没有提供Token");
    }

    // 开发模式临时token支持（仅用于开发调试）
    if (process.env.NODE_ENV === 'development' && token === "dev-temp-token") {
      req.user = { id: 1, username: "testuser" };
      return next();
    }

    // 验证JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return ResponseHandler.unauthorizedError(res, "Token无效");
    }
    if (err.name === 'TokenExpiredError') {
      return ResponseHandler.unauthorizedError(res, "Token已过期");
    }
    return ResponseHandler.error(res, "认证过程中发生错误", 500);
  }
};
