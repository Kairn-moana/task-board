// DOM 操作层
import { state } from "./state.js";
import * as api from "./api.js"; // 导入 API 以在事件处理器中使用

// --- DOM 元素获取 ---
export const cardModal = document.getElementById("card-modal");
const modalCardTitle = document.getElementById("modal-card-title");

// --- 核心渲染函数 ---

export function renderBoardsList(boards) {
  const mainContainer = document.querySelector("main.board");
  if (!mainContainer) return;

  if (boards.length === 0) {
    mainContainer.innerHTML = `
            <h2>你还没有创建任何看板</h2>
            <button id="create-board-btn">创建一个新看板</button>
        `;
    document
      .getElementById("create-board-btn")
      .addEventListener("click", handleCreateBoard);
  } else {
    renderSingleBoard(boards[0].id);
  }
}

export function renderSingleBoardUI(boardDetailLists, boardId) {
  const mainContainer = document.querySelector("main.board");
  mainContainer.innerHTML = "";

  const listsContainer = document.createElement("div");
  listsContainer.className = "lists-container";
  mainContainer.appendChild(listsContainer);

  if (boardDetailLists && boardDetailLists.length > 0) {
    boardDetailLists.forEach((list) => {
      const listEl = createListElement(list, boardId);
      listsContainer.appendChild(listEl);
    });
  } else {
    listsContainer.innerHTML = `
            <h3>这个看板下还没有列表，快去创建一个吧！</h3>
            <button id="create-list-btn">创建新列表</button>
        `;
    document
      .getElementById("create-list-btn")
      .addEventListener("click", () => handleCreateList(boardId));
  }
  initializeDragAndDrop();
}

// --- UI 组件创建函数 ---

function createListElement(list, boardId) {
  const listEl = document.createElement("div");
  listEl.className = "list";
  listEl.dataset.listId = list.id;

  // ... (createListElement 的内部逻辑保持不变, 但内部的事件处理器需要调用外部函数)
  const titleContainer = document.createElement("div");
  titleContainer.className = "list-title-container";
  const titleEl = document.createElement("h3");
  titleEl.className = "list-title";
  titleEl.textContent = list.title;
  const deleteBtn = document.createElement("span");
  deleteBtn.className = "list-delete-btn";
  deleteBtn.innerHTML = "×";
  deleteBtn.addEventListener("click", () => handleDeleteList(list.id));
  titleContainer.appendChild(titleEl);
  titleContainer.appendChild(deleteBtn);

  const cardsEl = document.createElement("div");
  cardsEl.className = "cards";
  if (list.cards && list.cards.length > 0) {
    list.cards.forEach((card) => {
      const cardEl = createCardElement(card);
      cardsEl.appendChild(cardEl);
    });
  }

  const addCardBtn = document.createElement("button");
  addCardBtn.className = "add-card-btn";
  addCardBtn.textContent = "+ 添加卡片";
  addCardBtn.addEventListener("click", () =>
    handleCreateCard(boardId, list.id)
  );

  listEl.appendChild(titleContainer);
  listEl.appendChild(cardsEl);
  listEl.appendChild(addCardBtn);

  return listEl;
}

function createCardElement(card) {
  const cardEl = document.createElement("div");
  cardEl.className = "card";
  cardEl.dataset.cardId = card.id;

  const titleEl = document.createElement("div");
  titleEl.className = "card-title-preview";
  titleEl.textContent = card.title;
  cardEl.appendChild(titleEl);

  const deleteBtn = document.createElement("span");
  deleteBtn.className = "card-delete-btn";
  deleteBtn.innerHTML = "×";
  deleteBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    handleDeleteCard(card.id, card.title);
  });
  cardEl.appendChild(deleteBtn);

  if (card.description) {
    const previewEl = document.createElement("div");
    previewEl.className = "card-description-preview";
    const cleanHTML = DOMPurify.sanitize(card.description);
    previewEl.innerHTML = cleanHTML;
    cardEl.appendChild(previewEl);
  }

  cardEl.addEventListener("click", () => handleOpenCardModal(card.id));
  return cardEl;
}

// --- 模态框相关函数 ---

export function openCardModal(card) {
  state.currentEditingCardId = card.id;
  modalCardTitle.textContent = card.title;

  if (!state.quill) {
    state.quill = new Quill("#editor-container", {
      theme: "snow",
      modules: {
        toolbar: [
          /* ... toolbar config ... */
        ],
      },
      placeholder: "添加更详细的描述...",
    });
  }

  if (card.description) {
    state.quill.clipboard.dangerouslyPasteHTML(card.description);
  } else {
    state.quill.setText("");
  }
  cardModal.style.display = "flex";
}

export function closeCardModal() {
  cardModal.style.display = "none";
}

// --- 其他 UI 功能 ---

function initializeDragAndDrop() {
  const cardContainers = document.querySelectorAll(".cards");
  cardContainers.forEach((container) => {
    new Sortable(container, {
      group: "shared-lists",
      animation: 150,
      onEnd: (evt) => {
        /* ... 拖拽逻辑 ... */
      },
    });
  });
}
