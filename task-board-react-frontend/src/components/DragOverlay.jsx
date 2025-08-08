import React from 'react';
import './DragOverlay.css';

// 拖拽时的卡片预览组件
export const DragCardOverlay = ({ card }) => {
  if (!card) return null;

  return (
    <div className="drag-card-overlay">
      <div className="drag-card-content">
        <h3 className="drag-card-title">{card.title}</h3>
        {card.description && (
          <p className="drag-card-description">
            {card.description.replace(/<[^>]*>/g, '').substring(0, 50)}...
          </p>
        )}
        {card.priority > 0 && (
          <span className={`drag-card-priority priority-${card.priority}`}>
            {['', '低', '中', '高'][card.priority]}
          </span>
        )}
      </div>
    </div>
  );
};

// 拖拽目标指示器
export const DropIndicator = ({ isActive, position = 'bottom' }) => {
  if (!isActive) return null;

  return (
    <div className={`drop-indicator drop-indicator-${position}`}>
      <div className="drop-indicator-line"></div>
    </div>
  );
};

// 列表拖拽反馈
export const ListDropZone = ({ isOver, children }) => {
  return (
    <div className={`list-drop-zone ${isOver ? 'is-over' : ''}`}>
      {children}
      {isOver && (
        <div className="drop-zone-overlay">
          <div className="drop-zone-indicator">
            <span>在此处放置卡片</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default {
  DragCardOverlay,
  DropIndicator,
  ListDropZone
};