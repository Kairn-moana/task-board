CREATE TABLE IF NOT EXISTS daily_metrics (
    id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tasks_completed INTEGER DEFAULT 0,
    emotion_calm INTEGER DEFAULT 0,      -- '冷静'
    emotion_anxious INTEGER DEFAULT 0,   -- '焦虑'
    emotion_tense INTEGER DEFAULT 0,     -- '紧张'
    emotion_happy INTEGER DEFAULT 0,     -- '愉快'
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 为常用查询创建索引
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date_user ON daily_metrics(metric_date, user_id);