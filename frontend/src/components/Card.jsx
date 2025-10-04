import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import "../styles/Card.css";

// 根据 card.status 字段来定义状态
const STATUS = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

// 状态的配置，包括图标和CSS类名
const statusConfig = {
  [STATUS.TODO]: { icon: "📝", className: "status-todo" },
  [STATUS.IN_PROGRESS]: { icon: "⏳", className: "status-doing" },
  [STATUS.DONE]: { icon: "✅", className: "status-done" },
};

function Card({ card, onDelete, onOpenCard, focusMode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging, // 新增：可以获取拖拽状态
  } = useSortable({
    id: card.id,
  }); // 使用卡片的唯一ID

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // 当卡片被拖拽时，给它一个半透明的效果，用户体验更好
    opacity: isDragging ? 0.5 : 1,
  };

  const handleOpenModal = () => {
    if (typeof onOpenCard === "function") {
      onOpenCard(card);
    } else {
      console.error("错误：onOpenCard prop 不是一个函数！");
    }
  };

  const handleDelete = (e) => {
    // 关键：阻止事件冒泡
    e.stopPropagation();

    if (typeof onDelete === "function") {
      if (window.confirm(`确定要删除卡片 "${card.title}" 吗？`)) {
        onDelete(card.id);
      }
    } else {
      console.error("错误：onDelete prop 不是一个函数！");
    }
  };

  const statusInfo = statusConfig[card.status] || statusConfig[STATUS.TODO]; // 默认为 Todo

  const subtasksDone = card.subtasks
    ? card.subtasks.filter((t) => t.done).length
    : 0;
  const totalSubtasks = card.subtasks ? card.subtasks.length : 0;

  // --- 新增：截止日期状态与格式化文案 ---
  const isOverdue = card.due_date && new Date(card.due_date) < new Date();
  const formattedDueDate = card.due_date
    ? new Date(card.due_date).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "";

  // 从 props 中解构出 card 对象
  return (
    // 最外层的容器，只负责 dnd-kit 的 transform 和 transition
    // 注意：我们把 setNodeRef 放在这里
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="card-dnd-container"
    >
      <div className="card-wrapper">
        <div className="drag-handle" {...listeners}>
          ⠿
        </div>

        {/* 卡片内容区：现在它完全独立，可以安全使用 onClick */}
        <div className="card-content" onClick={handleOpenModal}>
          <span className="card-title">{card.title}</span>

          <span className="card-status-icon">{statusInfo.icon}</span>

          {/* 截止日期在专注模式下依然显示 */}
          {/* {card.due_date && (
            <span
              className={`card-due-date ${
                new Date(card.due_date) < new Date() ? "overdue" : ""
              }`}
            >
              📅 {new Date(card.due_date).toLocaleDateString()}
            </span>
          )} */}
        </div>
        <button className="card-delete-btn" onClick={handleDelete}>
          ×
        </button>
      </div>
    </div>
  );
}
export default Card;
