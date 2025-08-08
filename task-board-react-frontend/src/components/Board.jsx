import List from "./List";

function Board({ lists, onAddCard, onOpenCard, onDeleteCard }) {
  return (
    <div className="lists-container">
      {lists.map((list) => (
        <List
          key={list.id}
          list={list}
          onAddCard={onAddCard}
          onOpenCard={onOpenCard}
          onDeleteCard={onDeleteCard}
        />
      ))}
    </div>
  );
}
export default Board;
