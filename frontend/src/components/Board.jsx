import List from "./List";
import "../styles/Board.css"; // 确保你引入了样式文件

// 从 props 中解构出 onAddCard
function Board({ lists, onAddCard, onDeleteCard, onOpenCard, focusMode }) {
  return (
    <main className="lists-container">
      {lists.map((list) => (
        <div className="list-wrapper" key={list.id}>
          <List
            list={list}
            onAddCard={onAddCard} // 把函数继续传递给 List 组件
            onDeleteCard={onDeleteCard}
            onOpenCard={onOpenCard}
            focusMode={focusMode}
          />
        </div>
      ))}
    </main>
  );
}

export default Board;
