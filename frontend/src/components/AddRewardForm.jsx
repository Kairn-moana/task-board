import React, { useState } from "react";

const AddRewardForm = ({ onAdd }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAdd({ title: title.trim(), description: description.trim() });
      setTitle("");
      setDescription("");

      // 显示成功动画
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("添加奖励失败:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleClear = () => {
    if (title.trim() || description.trim()) {
      if (window.confirm("确定要清空所有输入内容吗？")) {
        setTitle("");
        setDescription("");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-form">
      <div className="form-group">
        <input
          type="text"
          placeholder="奖励名称 (例如: 看一集喜欢的剧)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="form-group">
        <textarea
          placeholder="描述 (可选)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSubmitting}
          rows={3}
        />
      </div>

      <div className="form-actions ">
        <button
          type="submit"
          className={`submit-btn ${showSuccess ? "success" : ""}`}
          disabled={!title.trim() || isSubmitting}
        >
          {isSubmitting ? "添加中..." : "完成"}
        </button>

        <button
          type="button"
          className="clear-btn"
          onClick={handleClear}
          disabled={isSubmitting}
        >
          清空
        </button>
      </div>
    </form>
  );
};

export default AddRewardForm;
