import React from 'react';
import './SkeletonLoader.css';

// 通用骨架屏组件
export const SkeletonBox = ({ width = '100%', height = '20px', className = '' }) => (
  <div 
    className={`skeleton-box ${className}`}
    style={{ width, height }}
  />
);

// 卡片骨架屏
export const CardSkeleton = () => (
  <div className="card-skeleton">
    <SkeletonBox height="16px" width="80%" className="mb-2" />
    <SkeletonBox height="12px" width="60%" className="mb-1" />
    <SkeletonBox height="12px" width="40%" />
  </div>
);

// 列表骨架屏
export const ListSkeleton = () => (
  <div className="list-skeleton">
    <SkeletonBox height="20px" width="70%" className="mb-3" />
    <div className="cards-skeleton">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);

// 看板骨架屏
export const BoardSkeleton = () => (
  <div className="board-skeleton">
    <div className="board-header-skeleton">
      <SkeletonBox height="28px" width="200px" />
      <div className="board-actions-skeleton">
        <SkeletonBox height="36px" width="100px" />
        <SkeletonBox height="36px" width="120px" />
      </div>
    </div>
    <div className="lists-container-skeleton">
      <ListSkeleton />
      <ListSkeleton />
      <ListSkeleton />
    </div>
  </div>
);

// 加载动画组件
export const LoadingSpinner = ({ size = 'medium', message = '加载中...' }) => (
  <div className="loading-spinner-container">
    <div className={`loading-spinner ${size}`}></div>
    {message && <p className="loading-message">{message}</p>}
  </div>
);

export default {
  SkeletonBox,
  CardSkeleton,
  ListSkeleton,
  BoardSkeleton,
  LoadingSpinner
};