const express = require("express");
const cors = require("cors");
const { globalErrorHandler, notFoundHandler } = require("./utils/errorHandler");
require("dotenv").config(); // 确保在顶部加载环境变量

// --- 1. 引入所有路由文件 ---
const authRoutes = require("./routes/auth");
const boardsRoutes = require("./routes/boards");
const cardsRoutes = require("./routes/cards");
const attachmentsRoutes = require("./routes/attachments");
const tagsRoutes = require("./routes/tags");

// const listsRoutes = require("./routes/lists"); // 假设你也有 lists.js 路由

const app = express();

// --- 2. 使用核心中间件 ---
app.use(cors());
app.use(express.json());

// --- 3. 挂载所有路由 ---
// 每个路径只挂载一次，且对应各自的文件
app.use("/api/auth", authRoutes);
app.use("/api/boards", boardsRoutes);
app.use("/api/cards", cardsRoutes);
app.use("/api/attachments", attachmentsRoutes);
app.use("/api/tags", tagsRoutes);

// --- 4. 数据库连接 (如果你的 db.js 里没有自动连接的话) ---
// const connectDB = require("./db_connect_function"); // 假设你的数据库连接逻辑在一个函数里
// connectDB(); // 如果需要手动调用

// --- 5. 启动服务器 ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {

});

// --- 6. (可选) 添加一个根路径的欢迎信息，方便测试 ---
app.get("/", (req, res) => {
  res.send("欢迎来到 Task Board API!");
});

// --- 7. 错误处理中间件 (必须在所有路由之后) ---
app.use(notFoundHandler);
app.use(globalErrorHandler);
