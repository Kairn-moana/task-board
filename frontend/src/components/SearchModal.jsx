import React, { useState, useEffect, useRef } from "react";
import {
  useKeyboardShortcuts,
  COMMON_SHORTCUTS,
} from "../hooks/useKeyboardShortcuts";
import { TagList } from "./Tag";
import "./SearchModal.css";

const SearchModal = ({
  isOpen,
  onClose,
  lists,
  onCardSelect,
  availableTags = [],
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filters, setFilters] = useState({
    priority: "all", // all, 1, 2, 3
    status: "all", // all, Todo, In Progress, Done
    dateRange: "all", // all, overdue, thisWeek, thisMonth
    hasAttachments: "all", // all, yes, no
    tags: [], // 选中的标签ID数组
  });
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef(null);

  // 应用过滤条件
  const applyFilters = (cards) => {
    return cards.filter((card) => {
      // 优先级过滤
      if (
        filters.priority !== "all" &&
        card.priority !== parseInt(filters.priority)
      ) {
        return false;
      }

      // 状态过滤
      if (filters.status !== "all" && card.status !== filters.status) {
        return false;
      }

      // 附件过滤
      if (filters.hasAttachments !== "all") {
        const hasAttachments = card.attachments && card.attachments.length > 0;
        if (filters.hasAttachments === "yes" && !hasAttachments) return false;
        if (filters.hasAttachments === "no" && hasAttachments) return false;
      }

      // 日期范围过滤
      if (filters.dateRange !== "all" && card.due_date) {
        const dueDate = new Date(card.due_date);
        const now = new Date();
        const startOfWeek = new Date(now);
        const startOfMonth = new Date(now);

        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfMonth.setDate(1);

        switch (filters.dateRange) {
          case "overdue":
            if (dueDate >= now) return false;
            break;
          case "thisWeek":
            if (
              dueDate < startOfWeek ||
              dueDate >
                new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
            )
              return false;
            break;
          case "thisMonth":
            if (
              dueDate.getMonth() !== now.getMonth() ||
              dueDate.getFullYear() !== now.getFullYear()
            )
              return false;
            break;
        }
      }

      // 标签过滤
      if (filters.tags.length > 0) {
        const cardTagIds = (card.tags || []).map((tag) => tag.id);
        // 检查卡片是否包含所有选中的标签
        const hasAllSelectedTags = filters.tags.every((tagId) =>
          cardTagIds.includes(tagId)
        );
        if (!hasAllSelectedTags) return false;
      }

      return true;
    });
  };

  // 搜索功能
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    let results = [];

    lists.forEach((list) => {
      list.cards.forEach((card) => {
        // 如果有搜索查询，进行文本匹配
        let textMatch = true;
        if (query) {
          const titleMatch = card.title.toLowerCase().includes(query);
          const descriptionMatch =
            card.description && card.description.toLowerCase().includes(query);
          textMatch = titleMatch || descriptionMatch;
        }

        if (textMatch) {
          results.push({
            ...card,
            listTitle: list.title,
            listId: list.id,
            matchType: query
              ? card.title.toLowerCase().includes(query)
                ? "title"
                : "description"
              : "filter",
          });
        }
      });
    });

    // 应用过滤条件
    results = applyFilters(results);

    // 按相关性排序
    if (query) {
      results.sort((a, b) => {
        // 标题匹配优先于描述匹配
        if (a.matchType === "title" && b.matchType === "description") return -1;
        if (a.matchType === "description" && b.matchType === "title") return 1;

        // 按优先级排序
        if (a.priority !== b.priority) return b.priority - a.priority;

        return 0;
      });
    }

    setFilteredResults(results);
    setSelectedIndex(0);
  }, [searchQuery, lists, filters]);

  // 键盘导航
  useKeyboardShortcuts(
    {
      navigateUp: {
        ...COMMON_SHORTCUTS.ARROW_UP,
        callback: () => {
          if (!isOpen) return;
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredResults.length - 1
          );
        },
        allowInInput: true,
      },
      navigateDown: {
        ...COMMON_SHORTCUTS.ARROW_DOWN,
        callback: () => {
          if (!isOpen) return;
          setSelectedIndex((prev) =>
            prev < filteredResults.length - 1 ? prev + 1 : 0
          );
        },
        allowInInput: true,
      },
      selectCard: {
        ...COMMON_SHORTCUTS.ENTER,
        callback: () => {
          if (!isOpen || filteredResults.length === 0) return;
          handleCardSelect(filteredResults[selectedIndex]);
        },
        allowInInput: true,
      },
      closeModal: {
        ...COMMON_SHORTCUTS.ESCAPE,
        callback: () => {
          if (isOpen) {
            handleClose();
          }
        },
        allowInInput: true,
      },
    },
    [isOpen, filteredResults, selectedIndex]
  );

  // 焦点管理
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery("");
      setFilteredResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleCardSelect = (card) => {
    onCardSelect(card);
    handleClose();
  };

  const resetFilters = () => {
    setFilters({
      priority: "all",
      status: "all",
      dateRange: "all",
      hasAttachments: "all",
      tags: [],
    });
  };

  const hasActiveFilters = () => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === "tags") return value.length > 0;
      return value !== "all";
    });
  };

  const getActiveFiltersCount = () => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === "tags") return count + (value.length > 0 ? 1 : 0);
      return count + (value !== "all" ? 1 : 0);
    }, 0);
  };

  const highlightMatch = (text, query) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="search-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getCardPriorityText = (priority) => {
    const priorities = ["", "低", "中", "高"];
    return priorities[priority] || "";
  };

  if (!isOpen) return null;

  return (
    <div className="search-modal-backdrop" onClick={handleClose}>
      <div
        className="search-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 搜索框 */}
        <div className="search-input-container">
          <div className="search-icon">🔍</div>
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索卡片..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button
            className={`filter-toggle-btn ${showFilters ? "active" : ""} ${
              hasActiveFilters() ? "has-filters" : ""
            }`}
            onClick={() => setShowFilters(!showFilters)}
            title="过滤选项"
          >
            🔧
            {hasActiveFilters() && (
              <span className="filter-count">{getActiveFiltersCount()}</span>
            )}
          </button>
          <div className="search-shortcut-hint">Esc 关闭</div>
        </div>

        {/* 过滤器 */}
        {showFilters && (
          <div className="search-filters">
            <div className="filters-header">
              <span>过滤条件</span>
              {hasActiveFilters() && (
                <button className="reset-filters-btn" onClick={resetFilters}>
                  重置
                </button>
              )}
            </div>

            <div className="filters-grid">
              {/* 优先级过滤 */}
              <div className="filter-group">
                <label>优先级</label>
                <select
                  value={filters.priority}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                >
                  <option value="all">全部</option>
                  <option value="3">高</option>
                  <option value="2">中</option>
                  <option value="1">低</option>
                </select>
              </div>

              {/* 状态过滤 */}
              <div className="filter-group">
                <label>状态</label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  <option value="all">全部</option>
                  <option value="Todo">待办</option>
                  <option value="In Progress">进行中</option>
                  <option value="Done">已完成</option>
                </select>
              </div>

              {/* 日期范围过滤 */}
              <div className="filter-group">
                <label>截止日期</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateRange: e.target.value,
                    }))
                  }
                >
                  <option value="all">全部</option>
                  <option value="overdue">已过期</option>
                  <option value="thisWeek">本周</option>
                  <option value="thisMonth">本月</option>
                </select>
              </div>

              {/* 附件过滤 */}
              <div className="filter-group">
                <label>附件</label>
                <select
                  value={filters.hasAttachments}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      hasAttachments: e.target.value,
                    }))
                  }
                >
                  <option value="all">全部</option>
                  <option value="yes">有附件</option>
                  <option value="no">无附件</option>
                </select>
              </div>
            </div>

            {/* 标签过滤 */}
            {availableTags.length > 0 && (
              <div className="tag-filter-section">
                <h4>按标签过滤</h4>
                <div className="tag-filter-options">
                  {availableTags.map((tag) => (
                    <label key={tag.id} className="tag-filter-checkbox">
                      <input
                        type="checkbox"
                        checked={filters.tags.includes(tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters((prev) => ({
                              ...prev,
                              tags: [...prev.tags, tag.id],
                            }));
                          } else {
                            setFilters((prev) => ({
                              ...prev,
                              tags: prev.tags.filter((id) => id !== tag.id),
                            }));
                          }
                        }}
                      />
                      <div className="tag-option-display">
                        <span
                          className="tag-color-indicator"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="tag-name">{tag.name}</span>
                      </div>
                    </label>
                  ))}
                </div>

                {/* 已选标签显示 */}
                {filters.tags.length > 0 && (
                  <div className="selected-tags-filter">
                    <span className="selected-tags-label">已选标签:</span>
                    <TagList
                      tags={availableTags.filter((tag) =>
                        filters.tags.includes(tag.id)
                      )}
                      size="small"
                      variant="removable"
                      onTagRemove={(tag) => {
                        setFilters((prev) => ({
                          ...prev,
                          tags: prev.tags.filter((id) => id !== tag.id),
                        }));
                      }}
                      className="selected-filter-tags"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 搜索结果 */}
        <div className="search-results">
          {(searchQuery.trim() || hasActiveFilters()) &&
            filteredResults.length === 0 && (
              <div className="search-no-results">
                <div className="no-results-icon">🔍</div>
                <p>没有找到匹配的卡片</p>
                <small>
                  {searchQuery.trim()
                    ? "尝试使用不同的关键词"
                    : "尝试调整过滤条件"}
                  {hasActiveFilters() && " 或清除过滤器"}
                </small>
              </div>
            )}

          {filteredResults.length > 0 && (
            <>
              <div className="search-results-header">
                <span>
                  找到 {filteredResults.length} 个结果
                  {hasActiveFilters() && (
                    <span className="filter-indicator">（已过滤）</span>
                  )}
                </span>
                <small>↑↓ 导航，Enter 选择</small>
              </div>
              <div className="search-results-list">
                {filteredResults.map((card, index) => (
                  <div
                    key={`${card.id}-${card.listId}`}
                    className={`search-result-item ${
                      index === selectedIndex ? "selected" : ""
                    }`}
                    onClick={() => handleCardSelect(card)}
                  >
                    <div className="search-result-content">
                      <div className="search-result-title">
                        {highlightMatch(card.title, searchQuery)}
                      </div>
                      {card.description && (
                        <div className="search-result-description">
                          {highlightMatch(
                            card.description
                              .replace(/<[^>]*>/g, "")
                              .substring(0, 100),
                            searchQuery
                          )}
                          {card.description.length > 100 && "..."}
                        </div>
                      )}
                      <div className="search-result-meta">
                        <span className="search-result-list">
                          📋 {card.listTitle}
                        </span>
                        {card.priority > 0 && (
                          <span
                            className={`search-result-priority priority-${card.priority}`}
                          >
                            🔥 {getCardPriorityText(card.priority)}
                          </span>
                        )}
                        {card.due_date && (
                          <span className="search-result-due-date">
                            📅 {new Date(card.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="search-result-arrow">→</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 快捷键提示 */}
        {!searchQuery.trim() && (
          <div className="search-tips">
            <div className="search-tips-title">快捷键</div>
            <div className="search-tips-list">
              <div className="search-tip">
                <kbd>Ctrl</kbd> + <kbd>K</kbd> 打开搜索
              </div>
              <div className="search-tip">
                <kbd>↑</kbd> <kbd>↓</kbd> 导航结果
              </div>
              <div className="search-tip">
                <kbd>Enter</kbd> 选择卡片
              </div>
              <div className="search-tip">
                <kbd>Esc</kbd> 关闭
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchModal;
