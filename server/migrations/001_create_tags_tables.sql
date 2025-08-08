-- 创建标签表
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- 十六进制颜色值
    board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, board_id) -- 每个看板内标签名唯一
);

-- 创建卡片标签关联表（多对多关系）
CREATE TABLE IF NOT EXISTS card_tags (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(card_id, tag_id) -- 防止重复关联
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_tags_board_id ON tags(board_id);
CREATE INDEX IF NOT EXISTS idx_card_tags_card_id ON card_tags(card_id);
CREATE INDEX IF NOT EXISTS idx_card_tags_tag_id ON card_tags(tag_id);

-- 插入一些默认标签颜色预设
INSERT INTO tags (name, color, board_id) VALUES 
    ('重要', '#EF4444', 1),
    ('紧急', '#F97316', 1),
    ('设计', '#8B5CF6', 1),
    ('开发', '#10B981', 1),
    ('测试', '#F59E0B', 1),
    ('文档', '#6B7280', 1)
ON CONFLICT (name, board_id) DO NOTHING;