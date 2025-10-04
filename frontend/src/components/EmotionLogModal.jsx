import React, { useState } from "react";
import "./Modal.css";

function EmotionLogModal({ isOpen, onClose, emotion }) {
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    // 在这里调用 API 保存情绪和备注
    console.log(`正在保存情绪: ${emotion}, 备注: ${notes}`);
    onClose(); // 关闭模态框
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-button">
          ×
        </button>
        <h2>记录情绪 {emotion}</h2>
        <textarea
          className="emotion-notes-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="有什么想补充的吗？"
          rows="4"
        />
        <div className="modal-actions">
          <button onClick={handleSave} className="save-button">
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmotionLogModal;
