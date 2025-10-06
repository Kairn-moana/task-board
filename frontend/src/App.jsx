import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import BoardPage from "./pages/BoardPage";
import BoardListPage from "./pages/BoardListPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import FocusFullscreen from "./pages/FocusFullscreen";
import TodayPage from "./pages/TodayPage";
import EmergencyKitPage from "./pages/EmergencyKitPage";
import EmotionDiaryPage from "./pages/EmotionDiaryPage";
import EditEmergencyKitPage from "./pages/EditEmergencyKitPage";
import EditRewardListPage from "./pages/EditRewardListPage";
import SettingsPage from "./pages/SettingsPage";
import SummaryPage from "./pages/SummaryPage";
import { ToastProvider } from "./components/Toast";
import "./App.css";

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 主页布局路由，包含侧边栏 */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        >
          {/* 今日视图 + 其它页面 */}
          <Route path="today" element={<TodayPage />} />
          <Route path="summary" element={<SummaryPage />} />
          <Route path="boards" element={<BoardListPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="focus" element={<FocusFullscreen />} />
          <Route path="emergency-kit" element={<EmergencyKitPage />} />
          <Route path="emotion-diary" element={<EmotionDiaryPage />} />
          <Route path="edit-emergency-kit" element={<EditEmergencyKitPage />} />
          <Route path="edit-reward-list" element={<EditRewardListPage />} />
          <Route path="settings" element={<SettingsPage />} />

          <Route index element={<Navigate to="today" replace />} />
        </Route>

        {/* 看板详情页全屏 */}
        <Route
          path="/boards/:boardId"
          element={
            <ProtectedRoute>
              <BoardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </ToastProvider>
  );
}

export default App;
