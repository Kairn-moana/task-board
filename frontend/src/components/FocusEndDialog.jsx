import React, { useState } from "react";

export default function FocusEndDialog({
  open,
  card,
  defaultEmotion = "neutral",
  onClose,
  onSubmit,
}) {
  const [markDone, setMarkDone] = useState(false);
  const [addMore, setAddMore] = useState(0);
  const [emotion, setEmotion] = useState(defaultEmotion);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "grid",
        placeItems: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 420,
          background: "#0f172a",
          color: "#e5e7eb",
          borderRadius: 16,
          padding: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 8 }}>🌟 你完成了“开始”！</h3>
        <p style={{ marginBottom: 12, color: "#94a3b8" }}>{card?.title}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label>
            <input
              type="checkbox"
              checked={markDone}
              onChange={(e) => setMarkDone(e.target.checked)}
            />{" "}
            ✅ 标记完成
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>➕ 再来</span>
            <select
              value={addMore}
              onChange={(e) => setAddMore(Number(e.target.value))}
            >
              <option value={0}>不追加</option>
              <option value={10}>10 分钟</option>
              <option value={20}>20 分钟</option>
              <option value={30}>30 分钟</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>情绪</span>
            <select
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
            >
              <option value="joy">愉快</option>
              <option value="calm">冷静</option>
              <option value="anxious">焦虑</option>
              <option value="tense">紧张</option>
              <option value="neutral">一般</option>
            </select>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 16,
          }}
        >
          <button
            className="btn"
            onClick={() => window.location.assign("/edit-reward-list")}
          >
            🎁 打开奖励清单
          </button>
          <button className="btn" onClick={onClose}>
            取消
          </button>
          <button
            className="btn"
            onClick={() => onSubmit({ markDone, addMoreMin: addMore, emotion })}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
