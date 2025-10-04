import React, { useState, useEffect } from "react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
} from "../api";
import { useToast } from "./Toast";
import "./NotificationCenter.css";

const NotificationCenter = ({ isOpen, onClose, onNotificationClick }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'unread'
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      loadNotifications(true);
      loadUnreadCount();
    }
  }, [isOpen, filter]);

  const loadNotifications = async (reset = false) => {
    if (loading) return;

    setLoading(true);
    const currentPage = reset ? 1 : page;

    try {
      const response = await getNotifications(
        currentPage,
        20,
        filter === "unread"
      );

      if (response.ok) {
        const data = await response.json();

        if (reset) {
          setNotifications(data.notifications);
          setPage(2);
        } else {
          setNotifications((prev) => [...prev, ...data.notifications]);
          setPage((prev) => prev + 1);
        }

        setHasMore(data.notifications.length === 20);
        setUnreadCount(data.unreadCount);
      } else {
        toast.error("加载通知失败");
      }
    } catch (error) {
      console.error("加载通知失败:", error);
      toast.error("加载通知失败");
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await getUnreadNotificationCount();
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("获取未读通知数量失败:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // 标记为已读
    if (!notification.read_at) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, read_at: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("标记通知已读失败:", error);
      }
    }

    // 跳转到相关卡片
    if (onNotificationClick && notification.card_id) {
      onNotificationClick(notification.card_id);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await markAllNotificationsAsRead();
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            read_at: n.read_at || new Date().toISOString(),
          }))
        );
        setUnreadCount(0);
        toast.success("所有通知已标记为已读");
      } else {
        toast.error("标记失败");
      }
    } catch (error) {
      console.error("标记所有通知已读失败:", error);
      toast.error("标记失败");
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();

    try {
      const response = await deleteNotification(notificationId);
      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        toast.success("通知已删除");
      } else {
        toast.error("删除失败");
      }
    } catch (error) {
      console.error("删除通知失败:", error);
      toast.error("删除失败");
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes < 1 ? "刚刚" : `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString("zh-CN");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "comment":
        return "💬";
      case "mention":
        return "📢";
      case "card_update":
        return "📝";
      default:
        return "🔔";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-center-backdrop" onClick={onClose}>
      <div className="notification-center" onClick={(e) => e.stopPropagation()}>
        <div className="notification-header">
          <h2>通知中心</h2>
          <div className="notification-header-actions">
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
                title="标记所有为已读"
              >
                全部已读
              </button>
            )}
            <button className="close-btn" onClick={onClose} title="关闭">
              ✕
            </button>
          </div>
        </div>

        <div className="notification-filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            全部 ({notifications.length})
          </button>
          <button
            className={`filter-btn ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            未读 ({unreadCount})
          </button>
        </div>

        <div className="notification-list">
          {loading && notifications.length === 0 ? (
            <div className="notification-loading">加载中...</div>
          ) : notifications.length === 0 ? (
            <div className="no-notifications">
              <div className="no-notifications-icon">🔔</div>
              <p>暂无通知</p>
              <small>当有新的评论或提及时，会在这里显示</small>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    !notification.read_at ? "unread" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                      {!notification.read_at && (
                        <span className="unread-indicator">•</span>
                      )}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-meta">
                      <span className="notification-time">
                        {formatTimestamp(notification.created_at)}
                      </span>
                      {notification.card_title && (
                        <span className="notification-card">
                          📋 {notification.card_title}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    className="delete-notification-btn"
                    onClick={(e) =>
                      handleDeleteNotification(notification.id, e)
                    }
                    title="删除通知"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {hasMore && (
                <button
                  className="load-more-btn"
                  onClick={() => loadNotifications()}
                  disabled={loading}
                >
                  {loading ? "加载中..." : "加载更多"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// 通知铃铛组件
export const NotificationBell = ({ unreadCount, onClick }) => {
  return (
    <button className="notification-bell" onClick={onClick} title="通知中心">
      🔔
      {unreadCount > 0 && (
        <span className="notification-badge">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationCenter;
