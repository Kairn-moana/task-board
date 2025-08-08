-- 清理现有数据
DELETE FROM card_tags;
DELETE FROM tags;
DELETE FROM attachments;
DELETE FROM cards;
DELETE FROM lists;
DELETE FROM boards;
DELETE FROM users;

-- 重置序列
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE boards_id_seq RESTART WITH 1;
ALTER SEQUENCE lists_id_seq RESTART WITH 1;
ALTER SEQUENCE cards_id_seq RESTART WITH 1;

-- 插入一个默认用户 (密码: admin123)
INSERT INTO users (username, email, password) VALUES 
('admin', 'admin@taskboard.com', '$2b$10$rQJ5kV4Vh3nB8DqGg.zEUQOHY7yNp7HwZUuM5BLUFfOQwg.eWJLnH6');

-- 插入示例看板
INSERT INTO boards (title, user_id) VALUES 
('我的项目看板', 1),
('个人任务', 1);

-- 插入示例列表
INSERT INTO lists (title, board_id, "order") VALUES 
('待办事项', 1, 0),
('进行中', 1, 1),
('已完成', 1, 2),
('今日任务', 2, 0),
('本周任务', 2, 1);

-- 插入示例卡片
INSERT INTO cards (title, description, list_id, "order", priority, status) VALUES 
('欢迎使用任务看板', '这是您的第一张卡片，您可以点击编辑它', 1, 0, 1, 'Todo'),
('学习拖拽功能', '尝试拖拽卡片到不同的列表中', 1, 1, 2, 'Todo'),
('探索标签功能', '为卡片添加彩色标签来分类任务', 2, 0, 2, 'In Progress'),
('体验搜索功能', '使用Ctrl+K打开搜索，或者使用右上角的搜索功能', 3, 0, 1, 'Done');

-- 插入示例标签
INSERT INTO tags (name, color, board_id) VALUES 
('重要', '#EF4444', 1),
('紧急', '#F59E0B', 1),
('学习', '#8B5CF6', 1),
('工作', '#10B981', 1);