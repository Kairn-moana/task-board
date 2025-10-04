//这个组件是一个纯粹的“展示”组件。它不包含任何自己的逻辑或状态，只是接收一大堆 props 并将它们渲染成表单。这种组件非常易于理解和测试。
import React from "react";

const CardMeta = ({
  // 状态
  status,
  setStatus,
  // 优先级
  priority,
  setPriority,
  // 日期
  dueDate,
  setDueDate,

  // 情绪
  emotion,
  setEmotion,
}) => {
  return (
    <div className="card-meta">
      <div className="meta-item">
        <label>状态</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Todo">待办</option>
          <option value="In Progress">进行中</option>
          <option value="Done">已完成</option>
        </select>
      </div>
      <div className="meta-item">
        <label>优先级</label>
        <select
          value={priority}
          onChange={(e) => setPriority(parseInt(e.target.value))}
        >
          <option value="0">无</option>
          <option value="1">低</option>
          <option value="2">中</option>
          <option value="3">高</option>
        </select>
      </div>
      <div className="meta-item">
        <label>截止日期</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div className="meta-item">
        <label>情绪</label>
        <div className="emotion-picker">
          {[
            { key: "冷静", emoji: "🧊", color: "#60a5fa" },
            { key: "焦虑", emoji: "😰", color: "#f59e0b" },
            { key: "紧张", emoji: "😫", color: "#ef4444" },
            { key: "愉快", emoji: "☺️", color: "#10b981" },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setEmotion(opt.key)}
              className={`emotion-option ${
                emotion === opt.key ? "active" : ""
              }`}
              style={{
                borderColor: emotion === opt.key ? opt.color : "transparent",
              }}
              title={opt.key}
            >
              <span style={{ marginRight: 6 }}>{opt.emoji}</span>
              {opt.key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CardMeta;
