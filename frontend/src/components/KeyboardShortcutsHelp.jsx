import React, { useState } from "react";
import {
  useKeyboardShortcuts,
  COMMON_SHORTCUTS,
  getShortcutDisplay,
} from "../hooks/useKeyboardShortcuts";
import "./KeyboardShortcutsHelp.css";

const KeyboardShortcutsHelp = () => {
  const [isOpen, setIsOpen] = useState(false);

  // 快捷键配置
  const shortcuts = [
    {
      category: "全局操作",
      items: [
        { shortcut: COMMON_SHORTCUTS.SEARCH, description: "打开完整搜索" },
        { shortcut: { key: "/" }, description: "快速搜索" },
        { shortcut: COMMON_SHORTCUTS.CREATE_CARD, description: "创建新卡片" },
        { shortcut: COMMON_SHORTCUTS.ESCAPE, description: "关闭模态框" },
        { shortcut: { key: "?", shift: true }, description: "显示快捷键帮助" },
      ],
    },
    {
      category: "导航",
      items: [
        { shortcut: COMMON_SHORTCUTS.ARROW_UP, description: "向上导航" },
        { shortcut: COMMON_SHORTCUTS.ARROW_DOWN, description: "向下导航" },
        { shortcut: COMMON_SHORTCUTS.ARROW_LEFT, description: "向左导航" },
        { shortcut: COMMON_SHORTCUTS.ARROW_RIGHT, description: "向右导航" },
        { shortcut: COMMON_SHORTCUTS.ENTER, description: "打开卡片详情" },
      ],
    },
    {
      category: "编辑",
      items: [
        { shortcut: COMMON_SHORTCUTS.SAVE, description: "保存更改" },
        { shortcut: COMMON_SHORTCUTS.DELETE, description: "删除选中项" },
      ],
    },
  ];

  // 添加快捷键监听
  useKeyboardShortcuts(
    {
      toggleHelp: {
        key: "?",
        shift: true,
        callback: () => {
          setIsOpen((prev) => !prev);
        },
      },
      closeHelp: {
        ...COMMON_SHORTCUTS.ESCAPE,
        callback: () => {
          if (isOpen) {
            setIsOpen(false);
          }
        },
      },
    },
    [isOpen]
  );

  if (!isOpen) {
    return (
      <button
        className="shortcuts-help-trigger"
        onClick={() => setIsOpen(true)}
        title="键盘快捷键 (?)"
      >
        ⌘
      </button>
    );
  }

  return (
    <div className="shortcuts-help-backdrop" onClick={() => setIsOpen(false)}>
      <div
        className="shortcuts-help-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcuts-help-header">
          <h2>键盘快捷键</h2>
          <button
            className="shortcuts-help-close"
            onClick={() => setIsOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="shortcuts-help-content">
          {shortcuts.map((category, index) => (
            <div key={index} className="shortcuts-category">
              <h3 className="shortcuts-category-title">{category.category}</h3>
              <div className="shortcuts-list">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="shortcuts-item">
                    <div className="shortcuts-keys">
                      {getShortcutDisplay(item.shortcut)
                        .split("+")
                        .map((key, keyIndex) => (
                          <kbd key={keyIndex} className="shortcut-key">
                            {key}
                          </kbd>
                        ))}
                    </div>
                    <span className="shortcuts-description">
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcuts-help-footer">
          <p>
            按 <kbd>?</kbd> 键或点击右下角按钮打开此帮助
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
