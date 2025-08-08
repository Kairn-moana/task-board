import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute"; // 导入"门卫"
import BoardPage from "./pages/BoardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { ToastProvider } from "./components/Toast";
import "./App.css";

// 一个受保护的路由组件
// function ProtectedRoute({ children }) {
//   const token = localStorage.getItem("token");
//   if (!token) {
//     // 如果没有 token，重定向到登录页
//     return <Navigate to="/login" replace />;
//   }
//   return children; // 如果有 token，渲染子组件（比如 BoardPage）
// }

function App() {
  return (
    <ToastProvider>
      <Routes>
        {" "}
        {/* Routes 组件用于包裹所有路由规则 */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <BoardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* 可以添加一个 404 页面 */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </ToastProvider>
  );
}

export default App;
