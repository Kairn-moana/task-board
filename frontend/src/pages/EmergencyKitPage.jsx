import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";
import "./EmergencyKitPage.css";

import EmergencyKitModal from "../components/EmergencyKitModal";
import RewardListModal from "../components/RewardListModal";
import EmotionLogModal from "../components/EmotionLogModal";
import EmotionCharts from "../components/EmotionCharts";

function EmergencyKitPage() {
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const { settings } = useSettings();

  const [isEmergencyKitModalOpen, setEmergencyKitModalOpen] = useState(false);
  const [isRewardListModalOpen, setRewardListModalOpen] = useState(false);
  const [isEmotionLogModalOpen, setEmotionLogModalOpen] = useState(false);

  // --- 动态生成智能提示的逻辑 ---
  const getSmartPrompt = () => {
    if (!selectedEmotion) {
      // 默认提示，之后可以替换为检查当天是否已记录的逻辑
      return "💡 选择一个表情来记录你当前的心情吧！";
    }
    const positiveEmotions = ["😊", "😐", "🎉"];
    if (positiveEmotions.includes(selectedEmotion)) {
      return "💡 看起来状态不错！推荐使用“任务奖励清单”来激励自己！";
    } else {
      return "💡 如果你感到焦虑或难过，可以随时使用“情绪急救包”。";
    }
  };

  const handleOpenEmotionLogModal = () => {
    if (selectedEmotion) {
      setEmotionLogModalOpen(true);
    }
  };

  return (
    <div className="emergency-kit-page">
      <header className="ekp-header">
        <h1>🧠 情绪工具中心</h1>
      </header>

      {/* 1. 快速情绪记录 (移动到顶部) */}
      <section className="ekp-card ekp-quick-log">
        <h3>现在感觉如何？</h3>
        <div className="emotion-buttons">
          {["😊", "😟", "😠", "😐", "🎉"].map((emoji) => (
            <button
              key={emoji}
              className={`emotion-button ${
                selectedEmotion === emoji ? "selected" : ""
              }`}
              onClick={() => setSelectedEmotion(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
        <button
          className="use-button"
          disabled={!selectedEmotion}
          onClick={handleOpenEmotionLogModal}
        >
          记录心情 (可备注)
        </button>
      </section>

      {!settings.simpleMode && (
        <>
          {/* 2. 智能提示区域 (现在是动态的) */}
          <section className="ekp-card ekp-smart-prompt">
            <p>{getSmartPrompt()}</p>
          </section>

          {/* 3. 情绪工具 (添加了 onClick 事件) */}
          <section className="ekp-tool-cards">
            <div className="ekp-card tool-card">
              <h3>🧯 情绪急救包</h3>
              <p>当你感到不知所措时，这里有平复心情的方法。</p>
              <button
                className="use-button"
                onClick={() => setEmergencyKitModalOpen(true)}
              >
                立即使用
              </button>
            </div>
            <div className="ekp-card tool-card">
              <h3>🎁 任务奖励清单</h3>
              <p>完成任务后，从这里选择一个奖励犒劳自己吧！</p>
              <button
                className="use-button"
                onClick={() => setRewardListModalOpen(true)}
              >
                立即使用
              </button>
            </div>
          </section>

          {/* 情绪趋势图 */}
          <section className="ekp-card">
            <EmotionCharts />
          </section>

          {/* 工具管理入口 */}
          <section className="ekp-card ekp-management-links">
            <ul>
              <li>
                <Link to="/edit-emergency-kit">编辑我的急救包</Link>
              </li>
              <li>
                <Link to="/edit-reward-list">编辑我的奖励清单</Link>
              </li>
              <li>
                <Link to="/emotion-diary">查看情绪日记</Link>
              </li>
              <li>
                <Link to="/settings">设置推荐模版</Link>
              </li>
            </ul>
          </section>
        </>
      )}

      {/* --- 渲染所有模态框 --- */}
      <EmergencyKitModal
        isOpen={isEmergencyKitModalOpen}
        onClose={() => setEmergencyKitModalOpen(false)}
      />
      <RewardListModal
        isOpen={isRewardListModalOpen}
        onClose={() => setRewardListModalOpen(false)}
      />
      <EmotionLogModal
        isOpen={isEmotionLogModalOpen}
        onClose={() => setEmotionLogModalOpen(false)}
        emotion={selectedEmotion}
      />
    </div>
  );
}

export default EmergencyKitPage;
