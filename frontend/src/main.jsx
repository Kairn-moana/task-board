import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { SettingsProvider } from "./contexts/SettingsContext";

// 添加全局错误处理
window.addEventListener("error", (event) => {
  console.error("Global error caught:", event.error);
  // 防止完全黑屏，如果发生错误，重定向到登录页面
  if (
    event.error &&
    event.error.message &&
    event.error.message.includes("Cannot read properties of null")
  ) {
    localStorage.removeItem("token"); // 清除可能损坏的token
    window.location.href = "/login";
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
