import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TagList } from "./Tag";

function Card({ card, onDelete, onOpenCard }) {
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

  // 从 props 中解构出 card 对象
  return (
    // 最外层的容器，只负责 dnd-kit 的 transform 和 transition
    // 注意：我们把 setNodeRef 放在这里
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="card-wrapper">
        {/* 拖拽把手：dnd-kit 的 listeners 只在这里生效 */}
        <div className="drag-handle" {...listeners}>
          ⠿
        </div>

        {/* 卡片内容区：现在它完全独立，可以安全使用 onClick */}
        <div className="card-content" onClick={handleOpenModal}>
          <span className="card-title">{card.title}</span>
          
          {/* 标签显示 */}
          {card.tags && card.tags.length > 0 && (
            <div className="card-tags">
              <TagList 
                tags={card.tags} 
                size="small" 
                maxVisible={3}
                className="card-tag-list"
              />
            </div>
          )}
          
          {/* 卡片元信息 */}
          <div className="card-meta-info">
            {card.priority > 0 && (
              <span className={`card-priority priority-${card.priority}`}>
                {['', '低', '中', '高'][card.priority]}
              </span>
            )}
            {card.due_date && (
              <span className={`card-due-date ${new Date(card.due_date) < new Date() ? 'overdue' : ''}`}>
                📅 {new Date(card.due_date).toLocaleDateString()}
              </span>
            )}
            {card.attachments && card.attachments.length > 0 && (
              <span className="card-attachments">
                📎 {card.attachments.length}
              </span>
            )}
          </div>
        </div>

        {/* 删除按钮区：也完全独立 */}
        <button className="card-delete-btn" onClick={handleDelete}>
          ×
        </button>
      </div>
    </div>
  );
}
export default Card;
