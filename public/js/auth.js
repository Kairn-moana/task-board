import * as api from ".api.js";

// --- 事件处理函数 ---

// 注册逻辑
async function handleRegister(event) {
  event.preventDefault(); // 阻止表单默认提交

  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  try {
    const response = await api.registerUser(
      usernameInput.value,
      passwordInput.value
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || "注册失败");
    }

    alert("注册成功！请登录。");
    window.location.href = "/login.html";
  } catch (error) {
    console.error("注册时出错:", error);
    alert(`注册失败: ${error.message}`);
  }
}

// 登录逻辑
async function handleLogin(event) {
  event.preventDefault();
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  try {
    const response = await api.loginUser(
      usernameInput.value,
      passwordInput.value
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || "登录失败");
    }

    localStorage.setItem("token", data.token);
    window.location.href = "/index.html";
  } catch (error) {
    console.error("登录时出错:", error);
    alert(`登录失败: ${error.message}`);
  }
}

// --- 主逻辑/入口 ---

document.addEventListener("DOMContentLoaded", () => {
  // 检查是否已经登录，如果已登录，直接跳转
  if (
    localStorage.getItem("token") &&
    !window.location.pathname.includes("index.html")
  ) {
    window.location.href = "/index.html";
    return; // 提前退出，不绑定事件
  }

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }
});
