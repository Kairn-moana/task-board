import React, { useEffect, useState } from "react";
import { useSettings } from "../contexts/SettingsContext";
import "./SettingsPage.css";

function SettingsPage() {
  const { settings, updateSetting } = useSettings();

  const [enableFocusAnalytics, setEnableFocusAnalytics] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("enableFocusAnalytics") === "true";
  });

  const [enableStepAnimations, setEnableStepAnimations] = useState(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem("enableStepAnimations");
    return v === null ? true : v === "true";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "enableFocusAnalytics",
        enableFocusAnalytics ? "true" : "false"
      );
    }
  }, [enableFocusAnalytics]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "enableStepAnimations",
        enableStepAnimations ? "true" : "false"
      );
    }
  }, [enableStepAnimations]);

  const handleToggle = (key) => {
    updateSetting(key, !settings[key]);
  };

  return (
    <div className="settings-page-container">
      <header className="settings-page-header">
        <h1>⚙️ 设置</h1>
      </header>

      <div className="settings-section">
        <h3>推荐内容</h3>
        <div className="setting-item">
          <label htmlFor="use-template">
            是否接受系统推荐内容（如初次使用时提示）
          </label>
          <input type="checkbox" id="use-template" defaultChecked />
        </div>
      </div>

      <div className="settings-section">
        <h3>分析设置</h3>
        <div className="setting-item">
          <label htmlFor="enable-focus-analytics">启用专注会话分析</label>
          <input
            type="checkbox"
            id="enable-focus-analytics"
            checked={enableFocusAnalytics}
            onChange={(e) => setEnableFocusAnalytics(e.target.checked)}
          />
        </div>
        <p style={{ color: "#6b7280", fontSize: 14 }}>
          开启后，分析页将展示“专注时段（近30天）”，使用你的时间记录（不影响基础数据）。
        </p>
      </div>

      <div className="settings-section">
        <h3>交互</h3>
        <div className="setting-item">
          <label htmlFor="enable-step-anim">一步步完成动效</label>
          <input
            type="checkbox"
            id="enable-step-anim"
            checked={enableStepAnimations}
            onChange={(e) => setEnableStepAnimations(e.target.checked)}
          />
        </div>
      </div>

      <div className="settings-section">
        <h2>ADHD/ASD 友好选项</h2>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.simpleMode}
              onChange={() => handleToggle("simpleMode")}
            />
            简洁模式
          </label>
          <p>隐藏图表等复杂元素，专注于核心记录功能。</p>
        </div>
        {/* ... other settings items ... */}
      </div>
    </div>
  );
}

export default SettingsPage;
