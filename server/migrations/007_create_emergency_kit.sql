-- 定义急救包条目的分类，方便未来进行筛选和展示
CREATE TYPE emergency_item_category AS ENUM ('呼吸', '身体', '认知', '环境');

-- 1. 创建存储急救包具体条目的表
CREATE TABLE IF NOT EXISTS emergency_kit_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category emergency_item_category NOT NULL,
    estimated_duration_minutes INTEGER, -- 预计时长（分钟）
    steps TEXT, -- 步骤或描述
    requires_tools BOOLEAN DEFAULT FALSE, -- 是否需要工具
    is_enabled BOOLEAN DEFAULT TRUE, -- 是否启用
    sort_order INTEGER DEFAULT 0, -- 用于拖拽排序
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_emergency_kit_items_user_id ON emergency_kit_items(user_id);

-- 添加注释
COMMENT ON TABLE emergency_kit_items IS '存储用户个性化的急救包条目';
COMMENT ON COLUMN emergency_kit_items.sort_order IS '数值越小，排序越靠前';
COMMENT ON COLUMN emergency_kit_items.is_enabled IS '控制该条目是否在推荐中显示';


-- 2. 创建记录用户完成急救动作的日志表
CREATE TABLE IF NOT EXISTS emergency_action_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES emergency_kit_items(id) ON DELETE CASCADE,
    -- emotion_log_id 可以用来关联触发此次急救的情绪记录，实现更完整的数据分析
    emotion_log_id INTEGER REFERENCES emotion_logs(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_emergency_action_logs_user_id ON emergency_action_logs(user_id);

-- 3. 为新用户或演示用户插入一些默认的急救包条目
INSERT INTO emergency_kit_items 
    (user_id, title, category, estimated_duration_minutes, steps, sort_order)
VALUES
    (1, '4-7-8 呼吸法', '呼吸', 5, '1. 舒适地坐着或躺下。\n2. 用鼻子深深吸气，默数4秒。\n3. 屏住呼吸，默数7秒。\n4. 用嘴缓缓呼气，默数8秒。\n5. 重复3-5次。', 0),
    (1, '渐进式肌肉放松', '身体', 10, '从脚趾开始，逐个绷紧身体的肌肉群（脚、小腿、大腿、臀部、腹部、手臂、肩膀、面部），每个部位保持5秒然后彻底放松10秒。', 1),
    (1, '喝一杯温水', '身体', 3, '专注地、慢慢地喝一杯温水，感受水的温度和流过身体的感觉。', 2),
    (1, '5-4-3-2-1 感官练习', '认知', 5, '找出并默念：\n- 5样你能看到的东西\n- 4样你能触摸到的东西\n- 3样你能听到的声音\n- 2样你能闻到的气味\n- 1样你能尝到的味道', 3),
    (1, '整理一个角落', '环境', 10, '选择一个小的、可控的区域，比如书桌一角或一个抽屉，进行整理。创造小范围的秩序感。', 4)
ON CONFLICT DO NOTHING;