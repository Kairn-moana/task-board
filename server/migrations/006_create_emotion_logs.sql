-- 1. Create the main table for emotion logs
CREATE TABLE IF NOT EXISTS emotion_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emotion VARCHAR(50) NOT NULL,
    intensity INTEGER CHECK (intensity >= 0 AND intensity <= 4), -- Optional: For long-press intensity
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_emotion_logs_user_id ON emotion_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_emotion_logs_created_at ON emotion_logs(created_at);

-- Add comments for clarity
COMMENT ON TABLE emotion_logs IS 'Stores standalone emotion logging entries.';
COMMENT ON COLUMN emotion_logs.intensity IS 'Optional intensity level from 0 to 4.';

-- 2. Create a table for user-definable quick tags for emotions
CREATE TABLE IF NOT EXISTS emotion_tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name) -- Prevent duplicate tag names for the same user
);

CREATE INDEX IF NOT EXISTS idx_emotion_tags_user_id ON emotion_tags(user_id);

COMMENT ON TABLE emotion_tags IS 'User-customizable tags for emotion logging.';
COMMENT ON COLUMN emotion_tags.sort_order IS 'To maintain user-defined order of tags.';

-- 3. Create a join table for the many-to-many relationship between logs and tags
CREATE TABLE IF NOT EXISTS emotion_log_tags (
    log_id INTEGER NOT NULL REFERENCES emotion_logs(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES emotion_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (log_id, tag_id)
);

COMMENT ON TABLE emotion_log_tags IS 'Associates emotion logs with emotion tags.';

-- 4. Insert default quick tags for a specific user (e.g., user_id = 1 for demo)
-- Note: In a real application, this might be triggered upon user registration.
INSERT INTO emotion_tags (user_id, name, sort_order) VALUES
(1, '工作', 0),
(1, '学习', 1),
(1, '社交', 2),
(1, '家庭', 3),
(1, '身体', 4),
(1, '其他', 5)
ON CONFLICT (user_id, name) DO NOTHING;