import { useEffect, useCallback } from 'react';

/**
 * 键盘快捷键管理Hook
 * @param {Object} shortcuts - 快捷键配置对象
 * @param {Array} dependencies - 依赖数组
 */
export const useKeyboardShortcuts = (shortcuts, dependencies = []) => {
  const handleKeyDown = useCallback((event) => {
    // 如果用户正在输入框或文本区域中，忽略快捷键
    const isInputFocused = ['INPUT', 'TEXTAREA'].includes(event.target.tagName) ||
                          event.target.contentEditable === 'true';
    
    // 遍历所有快捷键配置
    Object.entries(shortcuts).forEach(([key, config]) => {
      const { 
        key: targetKey, 
        ctrl = false, 
        shift = false, 
        alt = false, 
        meta = false,
        callback,
        allowInInput = false 
      } = config;

      // 检查按键是否匹配
      const keyMatches = event.key.toLowerCase() === targetKey.toLowerCase() ||
                        event.code === targetKey;
      
      // 检查修饰键是否匹配
      const modifiersMatch = event.ctrlKey === ctrl &&
                           event.shiftKey === shift &&
                           event.altKey === alt &&
                           event.metaKey === meta;

      // 如果快捷键匹配
      if (keyMatches && modifiersMatch) {
        // 如果在输入框中且不允许，则忽略
        if (isInputFocused && !allowInInput) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        callback(event);
      }
    });
  }, [shortcuts, ...dependencies]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

/**
 * 获取快捷键显示文本的工具函数
 * @param {Object} shortcut - 快捷键配置
 * @returns {string} 格式化的快捷键文本
 */
export const getShortcutDisplay = (shortcut) => {
  const { key, ctrl, shift, alt, meta } = shortcut;
  const parts = [];
  
  if (ctrl) parts.push('Ctrl');
  if (meta) parts.push('Cmd');
  if (alt) parts.push('Alt');
  if (shift) parts.push('Shift');
  
  // 格式化按键名称
  const keyName = key.length === 1 ? key.toUpperCase() : 
                 key === 'Escape' ? 'Esc' :
                 key === 'ArrowUp' ? '↑' :
                 key === 'ArrowDown' ? '↓' :
                 key === 'ArrowLeft' ? '←' :
                 key === 'ArrowRight' ? '→' :
                 key;
  
  parts.push(keyName);
  return parts.join('+');
};

/**
 * 通用快捷键配置
 */
export const COMMON_SHORTCUTS = {
  // 全局快捷键
  SEARCH: { key: 'k', ctrl: true },
  CREATE_CARD: { key: 'n' },
  ESCAPE: { key: 'Escape' },
  
  // 导航快捷键
  ARROW_UP: { key: 'ArrowUp' },
  ARROW_DOWN: { key: 'ArrowDown' },
  ARROW_LEFT: { key: 'ArrowLeft' },
  ARROW_RIGHT: { key: 'ArrowRight' },
  
  // 编辑快捷键
  SAVE: { key: 's', ctrl: true },
  DELETE: { key: 'Delete' },
  ENTER: { key: 'Enter' },
  
  // 应用快捷键
  HELP: { key: '?', shift: true },
  REFRESH: { key: 'r', ctrl: true },
};

export default useKeyboardShortcuts;