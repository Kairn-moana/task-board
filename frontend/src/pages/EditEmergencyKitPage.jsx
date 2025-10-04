import React, { useState, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  getAllEmergencyKitItems,
  updateEmergencyKitOrder,
  updateEmergencyKitItem,
} from "../api";
import { emergencyKitService } from "../api";
import "./EditEmergencyKitPage.css";
import "./EditPage.css"; // Reuse shared styles

// 分类配置
const CATEGORY_CONFIG = {
  呼吸: {
    icon: "🫁",
    title: "呼吸练习",
    color: "#60a5fa",
    bgColor: "rgba(96, 165, 250, 0.1)",
  },
  身体: {
    icon: "🧘‍♀️",
    title: "身体练习",
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.1)",
  },
  认知: {
    icon: "🧠",
    title: "认知调节",
    color: "#8b5cf6",
    bgColor: "rgba(139, 92, 246, 0.1)",
  },
  环境: {
    icon: "🪴",
    title: "环境调节",
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.1)",
  },
};

// 添加急救包项目的表单组件
const AddEmergencyKitForm = ({ onAdd }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("呼吸");
  const [duration, setDuration] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        title: title.trim(),
        description: description.trim(),
        category,
        estimated_duration_minutes: duration,
      });
      setTitle("");
      setDescription("");
      setDuration(5);
      setCategory("呼吸");

      // 显示成功动画
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("添加急救包项目失败:", error);
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
        setDuration(5);
        setCategory("呼吸");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-form">
      <div className="form-group">
        <input
          type="text"
          placeholder="急救包项目名称 (例如: 4-7-8 呼吸法)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="form-group">
        <textarea
          placeholder="详细步骤描述 (可选)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSubmitting}
          rows={3}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSubmitting}
            className="category-select"
          >
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.title}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <input
            type="number"
            placeholder="时长"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
            disabled={isSubmitting}
            min="1"
            max="60"
            className="duration-input"
          />
          <span className="duration-label">分钟</span>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="form-divider"></div>

      <div className="form-actions">
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

// 一个简单的开关组件
const ToggleSwitch = ({ checked, onChange }) => (
  <label className="switch">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="slider round"></span>
  </label>
);

const EditEmergencyKitPage = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState(new Set());

  useEffect(() => {
    async function fetchItems() {
      try {
        const kitItems = await getAllEmergencyKitItems();
        setItems(kitItems);
      } catch (error) {
        console.error("无法加载急救包条目:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchItems();
  }, []);

  const groupedItems = useMemo(() => {
    const groups = { 呼吸: [], 身体: [], 认知: [], 环境: [] };
    items.forEach((item) => {
      if (groups[item.category]) {
        groups[item.category].push(item);
      }
    });
    return groups;
  }, [items]);

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    setItems(reorderedItems);

    const orderedIds = reorderedItems.map((item) => item.id);
    updateEmergencyKitOrder(orderedIds).catch((err) => {
      console.error("更新排序失败:", err);
      // Optional: revert state on failure
    });
  };

  const handleToggle = (itemId, currentStatus) => {
    const newStatus = !currentStatus;

    // Optimistic UI update
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, is_enabled: newStatus } : item
    );
    setItems(updatedItems);

    // API call
    updateEmergencyKitItem(itemId, { is_enabled: newStatus }).catch((err) => {
      console.error("切换状态失败:", err);
      // Revert UI on failure
      setItems(items);
    });
  };

  const handleAddItem = async (newItemData) => {
    try {
      const newItem = await emergencyKitService.createEmergencyKitItem(
        newItemData
      );
      setItems((prevItems) => [newItem, ...prevItems]);
    } catch (error) {
      console.error("添加急救包项目失败:", error);
      throw error; // 重新抛出错误，让表单组件处理
    }
  };

  // 新增：切换卡片展开状态
  const toggleCardExpansion = (itemId) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // 新增：检查内容是否需要折叠
  const needsExpansion = (steps) => {
    // 简单判断：如果步骤文本超过一定长度，认为需要折叠
    return steps && steps.length > 150;
  };

  if (isLoading) {
    return <div className="page-container">正在加载您的急救包...</div>;
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>编辑我的急救包</h1>
        <p>在这里管理和排序您的即时帮助动作。</p>
      </header>

      {/* TODO: Add a form for creating new items */}

      <AddEmergencyKitForm onAdd={handleAddItem} />

      <DragDropContext onDragEnd={onDragEnd}>
        {Object.entries(groupedItems).map(([category, catItems]) => (
          <div key={category} className="category-group">
            <div className="category-header">
              <h3>
                {CATEGORY_CONFIG[category].icon}{" "}
                {CATEGORY_CONFIG[category].title}
              </h3>
            </div>
            <Droppable droppableId={category}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="kit-list"
                >
                  {catItems.map((item, index) => {
                    const isExpanded = expandedCards.has(item.id);
                    const shouldShowExpandButton = needsExpansion(item.steps);

                    return (
                      <Draggable
                        key={item.id}
                        draggableId={String(item.id)}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`kit-item-card ${
                              isExpanded ? "expanded" : ""
                            }`}
                          >
                            <div className="item-header">
                              <div className="item-title-section">
                                <h4 className="item-title">{item.title}</h4>
                                <span className="item-duration">
                                  ⏱️ {item.estimated_duration_minutes} 分钟
                                </span>
                              </div>
                              <span
                                className="item-category-badge"
                                style={{
                                  backgroundColor:
                                    CATEGORY_CONFIG[item.category].bgColor,
                                  color: CATEGORY_CONFIG[item.category].color,
                                }}
                              >
                                {CATEGORY_CONFIG[item.category].icon}{" "}
                                {item.category}
                              </span>
                            </div>

                            <div className="item-content">
                              <div className="item-steps-header">步骤</div>
                              <div className="item-steps-content">
                                {item.steps}
                              </div>
                              {shouldShowExpandButton && (
                                <button
                                  className="expand-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCardExpansion(item.id);
                                  }}
                                >
                                  {isExpanded ? "收起" : "展开更多"}
                                </button>
                              )}
                            </div>

                            <div className="item-controls">
                              <ToggleSwitch
                                checked={item.is_enabled}
                                onChange={() =>
                                  handleToggle(item.id, item.is_enabled)
                                }
                              />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </DragDropContext>
    </div>
  );
};

export default EditEmergencyKitPage;
