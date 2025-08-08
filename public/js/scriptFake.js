// --- 全局变量和配置 ---
const API_BASE_URL = "http://localhost:3000/api";
let currentBoardId = null; // 用于存储当前正在查看的看板ID
let quill;

// --- DOM 元素获取 ---
const cardModal = document.getElementById("card-modal");
const modalCloseBtn = document.querySelector(".modal-close-btn");
const modalSaveBtn = document.getElementById("modal-save-btn");
const modalCardTitle = document.getElementById("modal-card-title");
let currentEditingCardId = null; // 用于存储当前正在编辑的卡片ID

// --- 事件监听器 ---

// 页面加载完成时的主入口
document.addEventListener("DOMContentLoaded", () => {
  // 检查登录状态
  if (localStorage.getItem("token")) {
    renderBoardsList(); // 开始应用逻辑
  } else {
    window.location.href = "/login.html"; // 未登录则跳转
  }

  // 为登出按钮绑定事件
  const logoutButton = document.getElementById("logout-button"); // 假设你的登出按钮ID是这个
  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  }
});

// 关闭模态框的事件
modalCloseBtn.addEventListener(
  "click",
  () => (cardModal.style.display = "none")
);
window.addEventListener("click", (event) => {
  if (event.target == cardModal) {
    cardModal.style.display = "none";
  }
});

// 模态框保存事件
modalSaveBtn.addEventListener("click", async () => {
  if (!currentEditingCardId) return;

  // --- 新增 ---: 从 Quill 编辑器获取 HTML 内容
  const descriptionHTML = quill.root.innerHTML;

  // 检查内容是否是 Quill 的初始空状态 "<p><br></p>"，如果是，则视为空字符串
  const finalDescription =
    descriptionHTML === "<p><br></p>" ? "" : descriptionHTML;

  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/cards/${currentEditingCardId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          title: modalCardTitle.textContent, // 标题一般也需要可编辑
          description: finalDescription, // 发送从 Quill 获取的 HTML
        }),
      }
    );

    if (!response.ok) throw new Error("保存卡片详情失败");

    cardModal.style.display = "none";
    renderSingleBoard(currentBoardId); // 重新渲染当前看板
  } catch (error) {
    console.error("保存卡片时出错:", error);
    alert("保存失败！");
  }
});

// --- 核心功能函数 ---

// 渲染看板列表（或第一个看板）
async function renderBoardsList() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/boards`);
    if (!response.ok) throw new Error(`获取看板列表失败: ${response.status}`);
    const boards = await response.json();

    const mainContainer = document.querySelector("main.board");
    if (!mainContainer) return;

    if (boards.length === 0) {
      // 如果用户还没有看板
      mainContainer.innerHTML = `
                <h2>你还没有创建任何看板</h2>
                <button id="create-board-btn">创建一个新看板</button>
            `;
      document
        .getElementById("create-board-btn")
        .addEventListener("click", handleCreateBoard);
    } else {
      // 默认渲染第一个看板
      const firstBoardId = boards[0].id;
      renderSingleBoard(firstBoardId);
    }
  } catch (error) {
    console.error("获取看板列表时出错:", error);
  }
}

// 函数：渲染单个看板的详细内容 (列表和卡片)
async function renderSingleBoard(boardId) {
  currentBoardId = boardId; // 更新当前看板ID
  console.log(`正在渲染看板 ID: ${boardId}`);

  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/boards/${boardId}`);
    if (!response.ok) throw new Error(`获取看板 ${boardId} 数据失败`);
    const boardDetailLists = await response.json();

    const mainContainer = document.querySelector("main.board");
    mainContainer.innerHTML = ""; // 清空所有旧内容

    const listsContainer = document.createElement("div");
    listsContainer.className = "lists-container";
    mainContainer.appendChild(listsContainer);

    if (boardDetailLists && boardDetailLists.length > 0) {
      boardDetailLists.forEach((list) => {
        const listEl = createListElement(list, boardId);
        listsContainer.appendChild(listEl);
      });
    } else {
      // 处理看板下没有列表的情况
      listsContainer.innerHTML = `
                <h3>这个看板下还没有列表，快去创建一个吧！</h3>
                <button id="create-list-btn">创建新列表</button>
            `;
      document
        .getElementById("create-list-btn")
        .addEventListener("click", () => handleCreateList(boardId));
    }

    // --- 新增：重新初始化拖拽功能 ---
    initializeDragAndDrop();
  } catch (error) {
    console.error(`渲染看板 ${boardId} 时出错:`, error);
  }
}

// 创建单个列表元素的辅助函数
function createListElement(list, boardId) {
  const listEl = document.createElement("div");
  listEl.className = "list";
  listEl.dataset.listId = list.id;

  // 1. 创建标题容器，这是所有和标题相关的元素的家
  const titleContainer = document.createElement("div");
  titleContainer.className = "list-title-container";

  // 2. 创建标题 H3
  const titleEl = document.createElement("h3");
  titleEl.className = "list-title";
  titleEl.textContent = list.title;

  // 3. 创建列表删除按钮
  const deleteBtn = document.createElement("span");
  deleteBtn.className = "list-delete-btn";
  deleteBtn.innerHTML = "×"; // 使用 HTML 实体更标准
  deleteBtn.addEventListener("click", () => {
    if (
      confirm(
        `确定要永久删除列表 "${list.title}" 吗？这会删除列表下的所有卡片！`
      )
    ) {
      handleDeleteList(list.id);
    }
  });

  // 4. 按顺序将标题和删除按钮添加到标题容器中
  titleContainer.appendChild(titleEl);
  titleContainer.appendChild(deleteBtn);

  // 5. 创建卡片容器
  const cardsEl = document.createElement("div");
  cardsEl.className = "cards";

  // 6. 填充卡片
  if (list.cards && list.cards.length > 0) {
    list.cards.forEach((card) => {
      const cardEl = createCardElement(card);
      cardsEl.appendChild(cardEl);
    });
  } // 至此，卡片容器部件组装完毕

  // 7. 创建“添加卡片”按钮
  const addCardBtn = document.createElement("button");
  addCardBtn.className = "add-card-btn";
  addCardBtn.textContent = "+ 添加卡片";
  addCardBtn.addEventListener("click", () =>
    handleCreateCard(boardId, list.id)
  );

  // 8. 【关键】按正确的视觉顺序，将所有部件添加到主列表元素(listEl)中
  listEl.appendChild(titleContainer); // 标题容器在最上面
  listEl.appendChild(cardsEl); // 卡片容器在中间
  listEl.appendChild(addCardBtn); // 添加按钮在最下面

  // 9. 返回组装好的、完整的列表元素
  return listEl;
}

// 创建单个卡片元素的辅助函数
function createCardElement(card) {
  const cardEl = document.createElement("div");
  cardEl.className = "card";
  cardEl.dataset.cardId = card.id;

  // cardEl.textContent = card.title;
  // 创建卡片标题
  const titleEl = document.createElement("div");
  titleEl.className = "card-title-preview";
  titleEl.textContent = card.title;
  cardEl.appendChild(titleEl);

  // --- 新增：创建删除按钮 ---
  const deleteBtn = document.createElement("span");
  deleteBtn.className = "card-delete-btn";
  deleteBtn.innerHTML = "×"; // 一个漂亮的 "x" 符号

  deleteBtn.addEventListener("click", (event) => {
    // 关键！阻止事件冒泡，否则点击删除按钮会触发打开模态框的事件
    event.stopPropagation();

    // 弹出确认框
    if (confirm(`确定要永久删除卡片 "${card.title}" 吗？`)) {
      handleDeleteCard(card.id);
    }
  });
  cardEl.appendChild(deleteBtn);

  // --- 新增：创建并净化描述预览区域 ---
  if (card.description) {
    const previewEl = document.createElement("div");
    previewEl.className = "card-description-preview";

    // 1. 从数据库获取的可能是“脏”的HTML
    const dirtyHTML = card.description;

    // 2. 用 DOMPurify 进行“消毒”
    const cleanHTML = DOMPurify.sanitize(dirtyHTML);

    // 3. 将“干净”的HTML设置给 previewEl
    previewEl.innerHTML = cleanHTML;

    cardEl.appendChild(previewEl);
  }

  // --- 新增：为卡片添加点击事件以打开模态框 ---
  cardEl.addEventListener("click", () => handleOpenCardModal(card.id));

  return cardEl;
}

// --- 事件处理函数 (Handlers) ---

async function handleCreateBoard() {
  const boardTitle = prompt("请输入新看板的标题:");
  if (boardTitle && boardTitle.trim() !== "") {
    try {
      await fetchWithAuth(`${API_BASE_URL}/boards`, {
        method: "POST",
        body: JSON.stringify({ title: boardTitle.trim() }),
      });
      renderBoardsList(); // 成功后刷新
    } catch (error) {
      console.error("创建看板时出错:", error);
    }
  }
}

async function handleCreateList(boardId) {
  const listTitle = prompt("请输入新列表的标题:");
  if (listTitle && listTitle.trim() !== "") {
    try {
      await fetchWithAuth(`${API_BASE_URL}/boards/${boardId}/lists`, {
        method: "POST",
        body: JSON.stringify({ title: listTitle.trim() }),
      });
      renderSingleBoard(boardId); // 成功后刷新
    } catch (error) {
      console.error("创建列表时出错:", error);
    }
  }
}

async function handleCreateCard(boardId, listId) {
  const cardTitle = prompt("请输入新卡片的标题:");
  if (cardTitle && cardTitle.trim() !== "") {
    try {
      await fetchWithAuth(
        `${API_BASE_URL}/boards/${boardId}/lists/${listId}/cards`,
        {
          method: "POST",
          body: JSON.stringify({ title: cardTitle.trim() }),
        }
      );
      renderSingleBoard(boardId); // 成功后刷新
    } catch (error) {
      console.error("创建卡片时出错:", error);
    }
  }
}

// 打开卡片模态框的函数，现在要初始化并填充 Quill
async function handleOpenCardModal(cardId) {
  currentEditingCardId = cardId;
  try {
    // 需要一个获取单个卡片详情的后端接口 ---
    const response = await fetchWithAuth(`${API_BASE_URL}/cards/${cardId}`);
    if (!response.ok) throw new Error("获取卡片详情失败");
    const card = await response.json();

    // 填充模态框内容
    modalCardTitle.textContent = card.title;

    // --- 新增 ---: 初始化 Quill 编辑器
    if (!quill) {
      // 只有当 quill 实例不存在时才创建
      quill = new Quill("#editor-container", {
        // 确保你的 HTML 中有 <div id="editor-container"></div>
        theme: "snow",
        modules: {
          toolbar: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image"],
            ["clean"],
          ],
        },
        placeholder: "添加更详细的描述...",
      });
    }

    // --- 新增 ---: 将数据库中的 HTML 内容加载到 Quill 中
    if (card.description) {
      // 使用 Quill 的 API 来安全地设置内容
      quill.clipboard.dangerouslyPasteHTML(card.description);
    } else {
      // 如果没有描述，则清空编辑器
      quill.setText("");
    }

    cardModal.style.display = "flex";
  } catch (error) {
    console.error("打开卡片详情时出错:", error);
  }
}

async function handleDeleteCard(cardId) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/cards/${cardId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || "删除卡片失败");
    }

    // 删除成功后，最简单可靠的方式是重新渲染整个看板
    renderSingleBoard(currentBoardId);
  } catch (error) {
    console.error("删除卡片时出错:", error);
    alert(error.message);
  }
}

async function handleDeleteList(listId) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/lists/${listId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || "删除列表失败");
    }

    // 同样，重新渲染看板来更新UI
    renderSingleBoard(currentBoardId);
  } catch (error) {
    console.error("删除列表时出错:", error);
    alert(error.message);
  }
}

// --- 其他功能函数 ---

// 初始化拖拽功能
function initializeDragAndDrop() {
  const cardContainers = document.querySelectorAll(".cards");
  cardContainers.forEach((container) => {
    new Sortable(container, {
      group: "shared-lists",
      animation: 150,
      onEnd: async (evt) => {
        // ... (这里需要添加拖拽后更新后端的逻辑) ...
        console.log("拖拽结束:", {
          cardId: evt.item.dataset.cardId,
          newListId: evt.to.closest(".list").dataset.listId,
          newOrder: evt.newIndex,
        });
      },
    });
  });
}

// 登出函数
function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login.html";
}

// 发送带认证的 fetch 请求的工具函数
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}
