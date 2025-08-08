// 当 `card` prop 变化时 (即打开一个新的卡片详情时)，
// 当模态框打开，并且卡片数据变化时，用卡片的描述来设置编辑器的内容
// useEffect(() => {
// if (isOpen && editor && card) {
// // 使用 editor.commands.setContent 来更新，这比直接修改 content prop 更可靠
// const description = card.description || "";
// if (editor.getHTML() !== description) {
// editor.commands.setContent(description);
// setContent(description);
// }
// }
// }, [isOpen, card, editor]);
