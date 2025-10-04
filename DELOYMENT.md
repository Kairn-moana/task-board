# 任务板应用部署指南

## 📋 部署架构

- **前端**: Vercel
- **后端**: Railway
- **数据库**: Railway PostgreSQL

---

## 🗄️ 第一步：部署数据库

### 1. 创建 Railway 账号并创建 PostgreSQL 数据库

1. 访问 [Railway.app](https://railway.app)
2. 使用 GitHub 登录
3. 点击 **New Project** → **Provision PostgreSQL**
4. 数据库创建成功后，点击数据库服务

### 2. 获取数据库连接信息

在 Railway 的 PostgreSQL 服务中：

- 点击 **Variables** 标签
- 记录以下信息：
  - `PGHOST`
  - `PGPORT` (通常是 5432)
  - `PGUSER`
  - `PGPASSWORD`
  - `PGDATABASE`

### 3. 初始化数据库

1. 点击 **Data** 标签 → **Query**
2. 依次复制粘贴并执行以下文件的内容：

   ```bash
   # 1. 主初始化文件
   server/init_database.sql

   # 2. 迁移文件（按顺序）
   server/migrations/0001.sql
   server/migrations/001_create_tags_tables.sql
   server/migrations/002_time_management.sql
   server/migrations/003_card_emotion.sql
   server/migrations/004_create_analytics_table.sql
   server/migrations/005_create_completion_logs.sql
   server/migrations/006_create_emotion_logs.sql
   server/migrations/007_create_emergency_kit.sql
   server/migrations/008_create_rewards.sql
   ```

---

## 🖥️ 第二步：部署后端

### 1. 准备 Git 仓库

```bash
# 如果还没有 git 仓库
cd /Users/du/Documents/codePractice/task-board
git init
git add .
git commit -m "Initial commit"

# 推送到 GitHub
# 在 GitHub 上创建新仓库，然后：
git remote add origin https://github.com/你的用户名/task-board.git
git branch -M main
git push -u origin main
```

### 2. 在 Railway 部署后端

1. 在 Railway 项目中，点击 **New Service** → **GitHub Repo**
2. 选择你的 `task-board` 仓库
3. 点击 **Add variables** 添加环境变量：

```env
PORT=3000
NODE_ENV=production

# 数据库配置（使用第一步获取的信息）
DB_USER=${{Postgres.PGUSER}}
DB_HOST=${{Postgres.PGHOST}}
DB_DATABASE=${{Postgres.PGDATABASE}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_PORT=${{Postgres.PGPORT}}

# JWT 密钥（生成一个随机字符串）
JWT_SECRET=你的超级复杂密钥_至少32个字符_可以用随机生成器

# 前端 URL（暂时填写，部署前端后再更新）
FRONTEND_URL=http://localhost:5173
```

4. 配置构建设置：

   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

5. 点击 **Deploy**

### 3. 修改后端代码以支持生产环境

更新 `server/package.json`：

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

更新 `server/server.js` 的 CORS 配置：

```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
```

提交并推送更改：

```bash
git add .
git commit -m "Update for production deployment"
git push
```

### 4. 获取后端 URL

部署完成后：

- 在 Railway 服务页面，点击 **Settings** → **Generate Domain**
- 记录域名，类似：`your-app.up.railway.app`

---

## 🎨 第三步：部署前端

### 1. 创建生产环境配置

在 `task-board-react-frontend/` 目录下创建 `.env.production`：

```env
VITE_API_BASE_URL=https://你的后端域名.up.railway.app/api
```

### 2. 部署到 Vercel

1. 访问 [Vercel.com](https://vercel.com)
2. 使用 GitHub 登录
3. 点击 **Add New** → **Project**
4. 选择你的 `task-board` 仓库
5. 配置项目：

   - **Framework Preset**: Vite
   - **Root Directory**: `task-board-react-frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. 添加环境变量：

   ```
   VITE_API_BASE_URL=https://你的后端域名.up.railway.app/api
   ```

7. 点击 **Deploy**

### 3. 更新后端 CORS 配置

前端部署完成后，获取 Vercel 域名（如 `your-app.vercel.app`），然后：

1. 返回 Railway 的后端服务
2. 更新环境变量 `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Railway 会自动重新部署

---

## ✅ 第四步：测试部署

1. 访问你的 Vercel 前端 URL
2. 测试以下功能：
   - ✅ 用户注册
   - ✅ 用户登录
   - ✅ 创建看板
   - ✅ 创建卡片
   - ✅ 拖拽功能
   - ✅ 标签功能
   - ✅ 时间追踪

---

## 🐛 常见问题

### 问题 1: CORS 错误

**解决**: 确保 Railway 的 `FRONTEND_URL` 环境变量正确设置为 Vercel 域名

### 问题 2: 数据库连接失败

**解决**: 检查 Railway 数据库环境变量是否正确引用

### 问题 3: 前端 API 调用失败

**解决**: 检查 Vercel 的 `VITE_API_BASE_URL` 是否正确

### 问题 4: 构建失败

**解决**: 检查 `package.json` 的依赖是否完整

---

## 📊 监控和日志

### Railway 日志

- 在 Railway 服务页面点击 **Deployments** 查看日志

### Vercel 日志

- 在 Vercel 项目页面点击 **Deployments** → 选择部署 → **Functions**

---

## 🔄 后续更新

### 更新后端

```bash
git add .
git commit -m "Update backend"
git push
# Railway 会自动重新部署
```

### 更新前端

```bash
git add .
git commit -m "Update frontend"
git push
# Vercel 会自动重新部署
```

---

## 💰 费用估算

- **Railway**: 免费层 500 小时/月（足够小型应用）
- **Vercel**: 免费层无限制（个人项目）
- **总计**: $0/月（免费层完全够用）

---

## 🎉 完成！

你的应用现在已经在线运行了！

- 前端: https://your-app.vercel.app
- 后端: https://your-app.up.railway.app
- 数据库: Railway PostgreSQL

记得保存好所有的密钥和环境变量！
