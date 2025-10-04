import React, { useState, useEffect } from "react";
import {
  logEmotion,
  deleteEmotionLog,
  getEmotionTags,
  addTagToLog,
} from "../api/services/emotionService";
import {
  getEmergencyRecommendations,
  logEmergencyAction,
} from "../api/services/emergencyKitService";
import "./EmotionQuickLog.css";

const EMOTIONS = [
  { emoji: "😊", label: "开心" },
  { emoji: "😂", label: "大笑" },
  { emoji: "😍", label: "喜爱" },
  { emoji: "😟", label: "担心" },
  { emoji: "😠", label: "生气" },
];
const NEGATIVE_EMOTIONS = new Set(["😟", "😠"]);

const EmotionQuickLog = ({ onLogSuccess }) => {
  const [lastLog, setLastLog] = useState(null);
  const [isUndoVisible, setIsUndoVisible] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [recommendations, setRecommendations] = useState([]);
  const [completedActionId, setCompletedActionId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // 组件加载时获取可用标签
  useEffect(() => {
    async function fetchTags() {
      try {
        const tags = await getEmotionTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error("无法加载情绪标签:", error);
      }
    }
    fetchTags();
  }, []);

  // 控制撤销按钮的显示时间
  useEffect(() => {
    let timer;
    if (isUndoVisible) {
      timer = setTimeout(() => {
        setIsUndoVisible(false);
        setLastLog(null);
        setSelectedTags(new Set()); // 清空已选标签
        setRecommendations([]); // 清空推荐
        setCompletedActionId(null);
      }, 8000); // 延长至8秒，给用户足够时间查看和点击
    }
    return () => clearTimeout(timer);
  }, [isUndoVisible]);

  // 处理情绪点击事件
  const handleEmotionClick = async (emotion) => {
    if (isUndoVisible) {
      // 如果上一个记录的撤销还在，则先将其隐藏
      setIsUndoVisible(false);
      setLastLog(null);
      setSelectedTags(new Set());
      setRecommendations([]);
      setCompletedActionId(null);
    }

    try {
      const newLog = await logEmotion({ emotion });
      setLastLog(newLog);
      setIsUndoVisible(true);

      if (onLogSuccess) {
        onLogSuccess(newLog);
      }

      // 如果是负面情绪，则获取急救建议
      if (NEGATIVE_EMOTIONS.has(emotion)) {
        const recs = await getEmergencyRecommendations();
        setRecommendations(recs);
      }
    } catch (error) {
      console.error("记录情绪失败:", error);
    }
  };

  // 处理撤销操作
  const handleUndo = async () => {
    if (!lastLog) return;
    try {
      await deleteEmotionLog(lastLog.id);

      setIsUndoVisible(false);
      setLastLog(null);
      setSelectedTags(new Set());
      setRecommendations([]);
      setCompletedActionId(null);
    } catch (error) {
      // setToastMessage('撤销失败');
      console.error("撤销情绪记录失败:", error);
    }
  };

  // 处理标签点击
  const handleTagClick = async (tag) => {
    if (!lastLog || selectedTags.has(tag.id)) return;

    try {
      await addTagToLog(lastLog.id, tag.id);
      const newSelectedTags = new Set(selectedTags).add(tag.id);
      setSelectedTags(newSelectedTags);
    } catch (error) {
      console.error("添加标签失败:", error);
    }
  };

  // 处理急救建议点击
  const handleRecommendationClick = async (rec) => {
    if (!lastLog || completedActionId) return; // 防止重复点击

    try {
      await logEmergencyAction({ itemId: rec.id, emotionLogId: lastLog.id });
      setCompletedActionId(rec.id);
      // 设置一个 10 分钟后的轻提醒
      setTimeout(() => {
        // 在实际应用中，这里会调用一个全局的通知服务
        alert("感觉好些了吗？");
      }, 10 * 60 * 1000);
    } catch (error) {
      console.error("记录急救动作失败:", error);
    }
  };

  return (
    <div className="quick-log-container">
      {isUndoVisible ? (
        <div className="log-feedback with-tags">
          <div className="feedback-main">
            <span>心情已记录 ✓</span>
            <button onClick={handleUndo} className="undo-button">
              撤销
            </button>
          </div>
          <div className="quick-tags-container">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag)}
                className={`tag-chip ${
                  selectedTags.has(tag.id) ? "selected" : ""
                }`}
                disabled={selectedTags.has(tag.id)}
              >
                {tag.name}
              </button>
            ))}
          </div>
          {recommendations.length > 0 && (
            <div className="recommendations-container">
              <h4 className="recommendations-title" id="recs-title">
                需要一点帮助吗？试试看：
              </h4>
              <div role="list" aria-labelledby="recs-title">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="recommendation-item"
                    role="listitem"
                  >
                    <span>{rec.title}</span>
                    <button
                      onClick={() => handleRecommendationClick(rec)}
                      disabled={!!completedActionId}
                      className="action-button"
                      aria-label={`尝试急救动作: ${rec.title}`}
                    >
                      {completedActionId === rec.id ? "已完成 ✓" : "我试试"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="emotion-selector">
          <span id="quick-log-prompt" className="prompt">
            现在感觉怎么样？
          </span>
          <div
            className="emotion-buttons"
            role="group"
            aria-labelledby="quick-log-prompt"
          >
            {EMOTIONS.map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => handleEmotionClick(emoji)}
                className="emotion-button"
                aria-label={label}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionQuickLog;
