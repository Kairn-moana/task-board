import React, { useState } from "react";
import { saveEveningReview } from "../api/services/emotionService";
import "./EveningReviewModal.css";

const EveningReviewModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    happy: "",
    tense: "",
    welldone: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveEveningReview(formData);
      onClose(); // 保存成功后关闭弹窗
      setFormData({ happy: "", tense: "", welldone: "" }); // 清空表单
    } catch (error) {
      console.error("保存失败:", error);
      // 可以在此添加用户提示
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="review-modal-title"
        aria-modal="true"
      >
        <button onClick={onClose} className="close-button">
          ×
        </button>
        <h2 id="review-modal-title">今天过得怎么样？</h2>
        <p>花几分钟时间，回顾一下今天吧。</p>

        <div className="review-form">
          <div className="form-group">
            <label htmlFor="happy">今天让我开心的是…</label>
            <textarea
              id="happy"
              name="happy"
              value={formData.happy}
              onChange={handleChange}
              rows="3"
            />
          </div>
          <div className="form-group">
            <label htmlFor="tense">今天让我紧张的是…</label>
            <textarea
              id="tense"
              name="tense"
              value={formData.tense}
              onChange={handleChange}
              rows="3"
            />
          </div>
          <div className="form-group">
            <label htmlFor="welldone">我做得好的 1 件事是…</label>
            <textarea
              id="welldone"
              name="welldone"
              value={formData.welldone}
              onChange={handleChange}
              rows="3"
            />
          </div>
        </div>

        <div className="modal-actions">
          <button
            onClick={handleSave}
            className="save-button"
            disabled={isSaving}
          >
            {isSaving ? "保存中..." : "存入情绪日记"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EveningReviewModal;
