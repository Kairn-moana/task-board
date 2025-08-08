// 网络通信层
const API_BASE_URL = "http://localhost:3000/api";

// --- 私有的工具函数 ---
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

// --- 导出的 API 调用函数 ---

export async function getBoards() {
  return fetchWithAuth(`${API_BASE_URL}/boards`);
}

export async function getBoardDetails(boardId) {
  return fetchWithAuth(`${API_BASE_URL}/boards/${boardId}`);
}

export async function getCardDetails(cardId) {
  return fetchWithAuth(`${API_BASE_URL}/cards/${cardId}`);
}

export async function createBoard(title) {
  return fetchWithAuth(`${API_BASE_URL}/boards`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function createList(boardId, title) {
  return fetchWithAuth(`${API_BASE_URL}/boards/${boardId}/lists`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function createCard(boardId, listId, title) {
  return fetchWithAuth(
    `${API_BASE_URL}/boards/${boardId}/lists/${listId}/cards`,
    {
      method: "POST",
      body: JSON.stringify({ title }),
    }
  );
}

export async function updateCard(cardId, { title, description }) {
  return fetchWithAuth(`${API_BASE_URL}/cards/${cardId}`, {
    method: "PUT",
    body: JSON.stringify({ title, description }),
  });
}

export async function deleteCard(cardId) {
  return fetchWithAuth(`${API_BASE_URL}/cards/${cardId}`, { method: "DELETE" });
}

export async function deleteList(listId) {
  return fetchWithAuth(`${API_BASE_URL}/lists/${listId}`, { method: "DELETE" });
}

// --- 新增：认证相关的 API 调用函数 ---

export async function loginUser(username, password) {
  // 认证请求不需要 token，所以直接用 fetch
  return fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

export async function registerUser(username, password) {
  return fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}
