// 受保护的路由组件
import { Navigate } from "react-router-dom";
import { authService } from "../api/services/authService.js";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  // 开发模式：允许临时token
  if (
    process.env.NODE_ENV === "development" &&
    (!token || token === "dev-temp-token")
  ) {
    localStorage.setItem("token", "dev-temp-token");
    return children;
  }

  // 生产模式：严格检查认证状态
  if (!authService.isAuthenticated()) {
    // 如果没有有效token，重定向到登录页
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
