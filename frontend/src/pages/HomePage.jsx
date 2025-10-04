import React, { useState, useEffect } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import EveningReviewModal from "../components/EveningReviewModal"; // 引入复盘弹窗
import "./HomePage.css";

const LAST_REVIEW_PROMPT_KEY = "lastReviewPromptDate";

function HomePage() {
  // 您可以将 src 替换为您的 logo 图片路径
  const logoUrl = "/vite.svg"; // 使用 Vite logo 作为示例
  const userAvatarUrl = "/path/to/avatar.png"; // 用户头像示例路径
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false); // 控制复盘弹窗的状态

  // 处理创建按钮点击事件
  const handleCreateClick = () => {
    // 创建并派发一个自定义事件，通知其他组件“需要创建新看板”
    window.dispatchEvent(new CustomEvent("create-new-board"));
  };

  // 1. 添加 state 来管理当前主题
  const [theme, setTheme] = useState("light");

  // 2. 使用 effect 在主题变化时更新 <html> 标签的属性
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    // 设置晚间复盘提醒的定时器
    const checkReviewTime = () => {
      const now = new Date();
      const lastPromptDate = localStorage.getItem(LAST_REVIEW_PROMPT_KEY);
      const today = now.toISOString().slice(0, 10);

      // 如果时间是 21:00 之后，并且今天还没提醒过
      if (now.getHours() >= 21 && lastPromptDate !== today) {
        setIsReviewModalOpen(true);
        localStorage.setItem(LAST_REVIEW_PROMPT_KEY, today);
      }
    };

    // 立即检查一次，并设置一个定时器每小时检查一次
    checkReviewTime();
    const intervalId = setInterval(checkReviewTime, 60 * 60 * 1000); // 每小时检查

    return () => clearInterval(intervalId); // 组件卸载时清除定时器
  }, [theme]);

  // 3. 创建切换主题的函数
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <div className="home-page">
      <header className="top-nav">
        <div className="nav-left">
          <img src={logoUrl} alt="Logo" className="project-logo" />
          <span className="project-name">Taskify</span>
          <button className="create-btn" onClick={handleCreateClick}>
            Create
          </button>
        </div>
        <div className="nav-right">
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label="Toggle theme"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <div
            className="user-avatar"
            style={{ backgroundImage: `url(${userAvatarUrl})` }}
          ></div>
        </div>
      </header>
      <div className="page-container">
        <div className="page-body">
          <aside className="side-nav">
            <nav>
              <ul>
                <li>
                  <NavLink
                    to="/today"
                    className={({ isActive }) =>
                      "nav-item" + (isActive ? " active" : "")
                    }
                  >
                    主页
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/boards"
                    className={({ isActive }) =>
                      "nav-item" + (isActive ? " active" : "")
                    }
                  >
                    🗂️ 我的看板
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/analytics"
                    className={({ isActive }) =>
                      "nav-item" + (isActive ? " active" : "")
                    }
                  >
                    📈 数据分析
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/focus"
                    className={({ isActive }) =>
                      "nav-item" + (isActive ? " active" : "")
                    }
                  >
                    🧘 专注模式
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/emergency-kit"
                    className={({ isActive }) =>
                      "nav-item" + (isActive ? " active" : "")
                    }
                  >
                    🧠 情绪辅助工具
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                      "nav-item" + (isActive ? " active" : "")
                    }
                  >
                    ⚙️ 设置
                  </NavLink>
                </li>
              </ul>
            </nav>
          </aside>
          <main className="main-content">
            <Outlet /> {/* 在这里渲染子路由的组件 */}
          </main>
        </div>
      </div>
      {/* 渲染复盘弹窗 */}
      <EveningReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />
    </div>
  );
}

export default HomePage;
