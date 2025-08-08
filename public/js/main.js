import * as api from "./api.js";
import * as ui from "./ui.js";
import { state } from "./state.js";

// --- 全局事件处理 ---

// 页面加载完成时的主入口
document.addEventListener("DOMContentLoaded", () => {
  // 检查登录状态
  if (localStorage.getItem("token")) {
    loadInitialData();
  } else {
    window.location.href = "/login.html"; // 未登录则跳转
  }
  setupEventListeners();
});

function setupEventListeners() {
  const logoutButton = document.getElementById("logout-button"); // 假设你的登出按钮ID是这个
  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  }

  const modalCloseBtn = document.querySelector(".modal-close-btn");
  const modalSaveBtn = document.getElementById("modal-save-btn");

  modalCloseBtn.addEventListener("click", ui.closeCardModal);
  window.addEventListener("click", (event) => {
    if (event.target == ui.cardModal) {
      ui.closeCardModal();
    }
  });
  modalSaveBtn.addEventListener("click", handleSaveCard);
}

// --- 业务逻辑/协调函数 ---

async function loadInitialData() {
  try {
    const response = await api.getBoards();
    if (!response.ok) throw new Error("获取看板失败");
    const boards = await response.json();
    // 如果没有看板，ui.renderBoardsList 内部会处理
    // 如果有，则触发第一个看板的渲染
    if (boards.length > 0) {
      renderSingleBoard(boards[0].id);
    } else {
      ui.renderBoardsList(boards); // 传递空数组以显示创建按钮
    }
  } catch (error) {
    console.error("加载初始数据时出错:", error);
  }
}

// 函数：渲染单个看板的详细内容 (列表和卡片)
async function renderSingleBoard(boardId) {
  state.currentBoardId = boardId; // 更新当前看板ID
  try {
    const response = await api.getBoardDetails(boardId);
    if (!response.ok) throw new Error("获取看板详情失败");
    const boardDetails = await response.json();
    ui.renderSingleBoardUI(boardDetails, boardId);
  } catch (error) {
    console.error(`渲染看板 ${boardId} 时出错:`, error);
  }
}

// 在 ui.js 中创建元素时绑定的事件，需要在这里定义
window.handleCreateBoard = async () => {
  const boardTitle = prompt("请输入新看板的标题:");
  if (boardTitle && boardTitle.trim() !== "") {
    await api.createBoard(boardTitle.trim());
    loadInitialData(); // 重新加载
  }
};

window.handleCreateList = async (boardId) => {
  const listTitle = prompt("请输入新列表的标题:");
  if (listTitle && listTitle.trim() !== "") {
    await api.createList(boardId, listTitle.trim());
    renderSingleBoard(boardId);
  }
};

window.handleCreateCard = async (boardId, listId) => {
  const cardTitle = prompt("请输入新卡片的标题:");
  if (cardTitle && cardTitle.trim() !== "") {
    await api.createCard(boardId, listId, cardTitle.trim());
    renderSingleBoard(boardId);
  }
};

window.handleDeleteCard = async (cardId, cardTitle) => {
  if (confirm(`确定要永久删除卡片 "${cardTitle}" 吗？`)) {
    await api.deleteCard(cardId);
    renderSingleBoard(state.currentBoardId);
  }
};

window.handleDeleteList = async (listId, listTitle) => {
  if (
    confirm(`确定要永久删除列表 "${listTitle}" 吗？这会删除列表下的所有卡片！`)
  ) {
    await api.deleteList(listId);
    renderSingleBoard(state.currentBoardId);
  }
};

window.handleOpenCardModal = async (cardId) => {
  try {
    const response = await api.getCardDetails(cardId);
    if (!response.ok) throw new Error("获取卡片失败");
    const card = await response.json();
    ui.openCardModal(card);
  } catch (error) {
    console.error("打开模态框时出错:", error);
  }
};

async function handleSaveCard() {
  if (!state.currentEditingCardId) return;
  const descriptionHTML = state.quill.root.innerHTML;
  const finalDescription =
    descriptionHTML === "<p><br></p>" ? "" : descriptionHTML;

  // 假设标题不可编辑，如果可编辑需要从DOM获取
  await api.updateCard(state.currentEditingCardId, {
    description: finalDescription,
  });
  ui.closeCardModal();
  renderSingleBoard(state.currentBoardId);
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login.html";
}
