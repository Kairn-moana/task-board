import React, { useState } from "react";

const RewardItem = ({ item, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(item.title);
  const [editedDescription, setEditedDescription] = useState(item.description);

  const handleSave = () => {
    onUpdate(item.id, {
      ...item,
      title: editedTitle,
      description: editedDescription,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(item.title);
    setEditedDescription(item.description);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="reward-card editing">
        <div className="reward-card-content">
          <input
            type="text"
            className="reward-title-input"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder="奖励名称"
          />
          <textarea
            className="reward-description-input"
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            placeholder="描述 (可选)"
          />
        </div>
        <div className="reward-actions">
          <button className="save-btn" onClick={handleSave}>
            ✓
          </button>
          <button className="cancel-btn" onClick={handleCancel}>
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reward-card">
      <div className="reward-card-content">
        <h4 className="reward-title">{item.title}</h4>
        {item.description && (
          <p className="reward-description">{item.description}</p>
        )}
      </div>
      <div className="reward-actions">
        <button
          className="edit-btn"
          onClick={() => setIsEditing(true)}
          title="编辑"
        >
          ✏️
        </button>
        <button
          className="delete-btn"
          onClick={() => onDelete(item.id)}
          title="删除"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default RewardItem;
