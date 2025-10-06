// 认证相关的API服务
import { api } from "../../utils/apiUtils.js";
// 删除 ENV 导入，直接硬编码 API URL
const API_URL = "https://karin-task-board-api.onrender.com/api";

export const authService = {
  // 用户登录
  async login(username, password) {
    // 认证请求不需要token，直接使用fetch
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || "登录失败");
    }

    return response.json();
  },

  // 用户注册
  async register(username, password) {
    // 认证请求不需要token，直接使用fetch
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || "注册失败");
    }

    return response.json();
  },

  // 登出
  logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  },

  // 检查认证状态
  isAuthenticated() {
    const token = localStorage.getItem("token");
    return !!token && token !== "dev-temp-token";
  },

  // 获取当前用户信息
  getCurrentUser() {
    let token;
    try {
      token = localStorage.getItem("token");
      if (!token || token === "dev-temp-token") {
        return null;
      }

      // 从JWT token中解析用户信息
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.user;
    } catch (error) {
      console.error("解析token失败:", error);
      // 出错时清除可能无效的token
      localStorage.removeItem("token");
      return null;
    }
  },
};
