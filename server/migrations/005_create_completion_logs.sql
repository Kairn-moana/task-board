CREATE TABLE IF NOT EXISTS completion_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    emotion VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 添加索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_completion_logs_user_id ON completion_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_completion_logs_completed_at ON completion_logs(completed_at);

-- 可选：添加备注
COMMENT ON TABLE completion_logs IS '记录任务完成时的情绪和时间快照';
COMMENT ON COLUMN completion_logs.user_id IS '完成任务的用户ID';
COMMENT ON COLUMN completion_logs.card_id IS '被完成的任务卡片ID';
COMMENT ON COLUMN completion_logs.completed_at IS '任务被标记为完成的时间';
COMMENT ON COLUMN completion_logs.emotion IS '完成任务时用户记录的情绪';