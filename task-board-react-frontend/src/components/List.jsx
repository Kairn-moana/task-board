import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Card from "./Card";

function List({ list, onAddCard, onOpenCard, onDeleteCard }) {
  // 获取当前列表所有卡片的 ID 数组
  const cardIds = list.cards.map((card) => card.id);

  return (
    <div className="list">
      <h3 className="list-title">{list.title}</h3>
      <SortableContext
        items={cardIds} // 告诉 SortableContext 这个容器里有哪些可排序项
        strategy={verticalListSortingStrategy}
      >
        <div className="cards">
          {list.cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onOpenCard={onOpenCard}
              onDelete={onDeleteCard}
            />
          ))}
        </div>
      </SortableContext>
      {/* --- 新增：添加卡片按钮 --- */}
      <button
        className="add-card-btn"
        // --- 关键：点击时，调用从 props 传来的 onAddCard 函数 ---
        onClick={() => onAddCard(list.id)}
      >
        + 添加卡片
      </button>
    </div>
  );
}
export default List;
