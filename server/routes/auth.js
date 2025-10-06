const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const ResponseHandler = require("../utils/responseHandler");
const { asyncHandler, AppError } = require("../utils/errorHandler");
const {
  validateRequired,
  validateUsername,
  validatePassword,
} = require("../utils/validators");
require("dotenv").config();

// POST /api/auth/register - 用户注册
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // 参数验证
    validateRequired(["username", "password"], req.body);
    const validUsername = validateUsername(username);
    const validPassword = validatePassword(password);

    // 1. 检查用户是否已存在
    const userExists = await db.query(
      "SELECT id FROM users WHERE username = $1",
      [validUsername]
    );

    if (userExists.rows.length > 0) {
      throw new AppError("用户名已存在", 400, "USER_EXISTS");
    }

    // 2. 对密码进行哈希加密
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(validPassword, salt);

    // 3. 将新用户存入数据库
    const newUser = await db.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username",
      [
        validUsername,
        req.body.email || `${validUsername}@example.com`,
        password_hash,
      ]
    );

    // 4. 创建并签发 JWT (新增)
    const payload = {
      user: {
        id: newUser.rows[0].id,
        username: newUser.rows[0].username,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return ResponseHandler.success(
      res,
      {
        token, // 添加 token 到响应
        user: newUser.rows[0],
      },
      "注册成功",
      201
    );
  })
);

// POST /api/auth/login - 用户登录
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // 参数验证
    validateRequired(["username", "password"], req.body);
    const validUsername = validateUsername(username);
    const validPassword = validatePassword(password);

    // 1. 查找用户
    const result = await db.query(
      "SELECT id, username, password FROM users WHERE username = $1",
      [validUsername]
    );

    const user = result.rows[0];
    if (!user) {
      throw new AppError("用户名或密码错误", 400, "INVALID_CREDENTIALS");
    }

    // 2. 验证密码 - 确保使用正确的字段名
    const isMatch = await bcrypt.compare(validPassword, user.password);
    if (!isMatch) {
      throw new AppError("用户名或密码错误", 400, "INVALID_CREDENTIALS");
    }

    // 3. 创建并签发 JWT
    const payload = {
      user: {
        id: user.id,
        username: user.username,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return ResponseHandler.success(
      res,
      {
        token,
        user: {
          id: user.id,
          username: user.username,
        },
      },
      "登录成功"
    );
  })
);

module.exports = router;
