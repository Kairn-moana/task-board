-- 1. 创建存储用户自定义奖励的表
CREATE TABLE IF NOT EXISTS reward_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    budget_cost INTEGER DEFAULT 0, -- 预算成本，可以是一个抽象单位
    available_start_time TIME, -- 可用时段开始，例如 18:00
    available_end_time TIME,   -- 可用时段结束，例如 22:00
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_reward_items_user_id ON reward_items(user_id);

-- 添加注释
COMMENT ON TABLE reward_items IS '存储用户个性化的奖励清单项目';
COMMENT ON COLUMN reward_items.budget_cost IS '用于预算控制的抽象成本值';
COMMENT ON COLUMN reward_items.available_start_time IS '该奖励可用的开始时间';


-- 2. 创建记录奖励领取历史的表
CREATE TABLE IF NOT EXISTS reward_redemption_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_item_id INTEGER NOT NULL REFERENCES reward_items(id) ON DELETE CASCADE,
    -- card_id 可以用来关联是完成了哪个任务后触发的奖励
    card_id INTEGER REFERENCES cards(id) ON DELETE SET NULL,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_reward_redemption_logs_user_id ON reward_redemption_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemption_logs_redeemed_at ON reward_redemption_logs(redeemed_at);


-- 3. 为演示用户插入一些默认的奖励项目
INSERT INTO reward_items 
    (user_id, title, description, budget_cost, available_start_time, available_end_time)
VALUES
    (1, '看一集喜欢的剧', '放松一下，看20-45分钟的剧集', 10, '18:00', '23:00'),
    (1, '玩15分钟游戏', '短暂的游戏时间，切换心情', 5, NULL, NULL),
    (1, '享用一份小零食', '比如一块巧克力或一杯奶茶', 5, '14:00', '22:00'),
    (1, '听几首喜欢的歌', '闭上眼睛，享受音乐', 0, NULL, NULL),
    (1, '解锁一篇付费文章', '用知识奖励自己', 15, '08:00', '23:00')
ON CONFLICT DO NOTHING;