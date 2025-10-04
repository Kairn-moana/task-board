import React, { useState, useRef, useEffect } from 'react';
import { useKeyboardShortcuts, COMMON_SHORTCUTS } from '../hooks/useKeyboardShortcuts';
import './QuickSearchBox.css';

const QuickSearchBox = ({ lists, onCardSelect, onOpenFullSearch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // 快速搜索逻辑（仅搜索标题）
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const searchQuery = query.toLowerCase();
    const quickResults = [];

    lists.forEach((list) => {
      list.cards.forEach((card) => {
        if (card.title.toLowerCase().includes(searchQuery)) {
          quickResults.push({
            ...card,
            listTitle: list.title,
            listId: list.id
          });
        }
      });
    });

    // 限制快速搜索结果数量
    setResults(quickResults.slice(0, 5));
    setSelectedIndex(0);
  }, [query, lists]);

  // 键盘快捷键
  useKeyboardShortcuts({
    // / 键打开快速搜索
    openQuickSearch: {
      key: '/',
      callback: () => {
        if (!isOpen) {
          setIsOpen(true);
        }
      }
    },
    // Esc 关闭
    closeSearch: {
      ...COMMON_SHORTCUTS.ESCAPE,
      callback: () => {
        if (isOpen) {
          handleClose();
        }
      },
      allowInInput: true
    },
    // 导航
    navigateUp: {
      ...COMMON_SHORTCUTS.ARROW_UP,
      callback: () => {
        if (!isOpen || results.length === 0) return;
        setSelectedIndex(prev => prev > 0 ? prev - 1 : results.length - 1);
      },
      allowInInput: true
    },
    navigateDown: {
      ...COMMON_SHORTCUTS.ARROW_DOWN,
      callback: () => {
        if (!isOpen || results.length === 0) return;
        setSelectedIndex(prev => prev < results.length - 1 ? prev + 1 : 0);
      },
      allowInInput: true
    },
    // Enter 选择
    selectCard: {
      ...COMMON_SHORTCUTS.ENTER,
      callback: () => {
        if (!isOpen) return;
        
        if (results.length > 0 && results[selectedIndex]) {
          handleCardSelect(results[selectedIndex]);
        } else if (query.trim()) {
          // 没有结果时打开完整搜索
          handleOpenFullSearch();
        }
      },
      allowInInput: true
    }
  }, [isOpen, results, selectedIndex, query]);

  // 焦点管理
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleCardSelect = (card) => {
    onCardSelect(card);
    handleClose();
  };

  const handleOpenFullSearch = () => {
    onOpenFullSearch(query); // 传递当前查询
    handleClose();
  };

  const highlightMatch = (text, query) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="quick-search-highlight">{part}</mark> : 
        part
    );
  };

  if (!isOpen) return null;

  return (
    <div className="quick-search-backdrop" onClick={handleClose}>
      <div className="quick-search-container" onClick={e => e.stopPropagation()}>
        <div className="quick-search-input-group">
          <div className="quick-search-icon">⚡</div>
          <input
            ref={inputRef}
            type="text"
            placeholder="快速搜索卡片标题..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="quick-search-input"
          />
          <button
            className="full-search-btn"
            onClick={handleOpenFullSearch}
            title="打开完整搜索 (Ctrl+K)"
          >
            🔍
          </button>
        </div>

        {/* 快速结果 */}
        {results.length > 0 && (
          <div className="quick-search-results">
            {results.map((card, index) => (
              <div
                key={`${card.id}-${card.listId}`}
                className={`quick-search-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleCardSelect(card)}
              >
                <div className="quick-search-card-info">
                  <div className="quick-search-title">
                    {highlightMatch(card.title, query)}
                  </div>
                  <div className="quick-search-meta">
                    <span className="quick-search-list">📋 {card.listTitle}</span>
                    {card.priority > 0 && (
                      <span className={`quick-search-priority priority-${card.priority}`}>
                        {['', '低', '中', '高'][card.priority]}
                      </span>
                    )}
                  </div>
                </div>
                <div className="quick-search-arrow">→</div>
              </div>
            ))}
          </div>
        )}

        {/* 无结果或提示 */}
        {query.trim() && results.length === 0 && (
          <div className="quick-search-no-results">
            <p>没有找到匹配的卡片</p>
            <button onClick={handleOpenFullSearch} className="try-full-search-btn">
              尝试完整搜索 →
            </button>
          </div>
        )}

        {/* 帮助提示 */}
        {!query.trim() && (
          <div className="quick-search-help">
            <div className="quick-search-tips">
              <div className="quick-tip">
                <kbd>/</kbd> 打开快速搜索
              </div>
              <div className="quick-tip">
                <kbd>Enter</kbd> 选择或完整搜索
              </div>
              <div className="quick-tip">
                <kbd>Esc</kbd> 关闭
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickSearchBox;