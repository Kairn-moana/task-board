import React, { useState, useEffect, createContext, useContext } from 'react';
import './Toast.css';

// Toast上下文
const ToastContext = createContext();

// Toast类型
const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// 单个Toast组件
const ToastItem = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case TOAST_TYPES.SUCCESS:
        return '✅';
      case TOAST_TYPES.ERROR:
        return '❌';
      case TOAST_TYPES.WARNING:
        return '⚠️';
      case TOAST_TYPES.INFO:
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`toast toast-${toast.type}`}>
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <div className="toast-message">
          <div className="toast-title">{toast.title}</div>
          {toast.description && (
            <div className="toast-description">{toast.description}</div>
          )}
        </div>
      </div>
      <button
        className="toast-close"
        onClick={() => onRemove(toast.id)}
        aria-label="关闭通知"
      >
        ×
      </button>
    </div>
  );
};

// Toast容器组件
const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
};

// Toast Provider组件
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: TOAST_TYPES.INFO,
      duration: 4000,
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const removeAllToasts = () => {
    setToasts([]);
  };

  // 便捷方法
  const toast = {
    success: (title, description, options = {}) =>
      addToast({ ...options, type: TOAST_TYPES.SUCCESS, title, description }),
    
    error: (title, description, options = {}) =>
      addToast({ ...options, type: TOAST_TYPES.ERROR, title, description }),
    
    warning: (title, description, options = {}) =>
      addToast({ ...options, type: TOAST_TYPES.WARNING, title, description }),
    
    info: (title, description, options = {}) =>
      addToast({ ...options, type: TOAST_TYPES.INFO, title, description }),
    
    custom: addToast,
    remove: removeToast,
    removeAll: removeAllToasts,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// 使用Toast的Hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export { TOAST_TYPES };
export default ToastProvider;