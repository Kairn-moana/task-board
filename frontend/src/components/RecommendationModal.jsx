import { useState } from "react";
import { analyticsService } from "../api/services";
import { TagList } from "./Tag";
import "./RecommendationModal.css";

const EMOTION_OPTIONS = [
  { key: "冷静", emoji: "🧊", color: "#60a5fa" },
  { key: "焦虑", emoji: "😰", color: "#f59e0b" },
  { key: "紧张", emoji: "😫", color: "#ef4444" },
  { key: "愉快", emoji: "☺️", color: "#10b981" },
];

function RecommendationModal({ isOpen, onClose }) {
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEmotionSelect = async (emotion) => {
    setSelectedEmotion(emotion);
    setLoading(true);
    setError(null);
    setRecommendations([]);

    try {
      const response = await analyticsService.getRecommendedTasks(emotion.key);
      setRecommendations(response.data || []);
    } catch (err) {
      setError("获取推荐失败，请稍后再试。");
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedEmotion(null);
    setRecommendations([]);
    setLoading(false);
    setError(null);
    onClose();
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return "未预估";
    const minutes = Math.floor(seconds / 60);
    return `${minutes} 分钟`;
  };

  if (!isOpen) return null;

  return (
    <div className="rec-modal-backdrop" onClick={reset}>
      <div className="rec-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={reset}>
          ×
        </button>

        {!selectedEmotion ? (
          <>
            <h2>现在感觉怎么样？</h2>
            <p>根据你当前的情绪，我可以为你推荐一些合适的任务来开始。</p>
            <div className="emotion-selector">
              {EMOTION_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  className="emotion-btn"
                  onClick={() => handleEmotionSelect(opt)}
                >
                  <span className="emotion-emoji">{opt.emoji}</span>
                  {opt.key}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2>为你推荐的任务...</h2>
            {loading && <p className="loading-text">正在为你分析...</p>}
            {error && <p className="error-text">{error}</p>}

            {!loading && recommendations.length > 0 && (
              <div className="recommendations-list">
                {recommendations.map((task) => (
                  <div key={task.id} className="rec-task-card">
                    <div className="rec-task-header">
                      <h3 className="rec-task-title">{task.title}</h3>
                      <span className="rec-task-time">
                        {formatTime(task.estimated_seconds)}
                      </span>
                    </div>
                    <div className="rec-task-tags">
                      <TagList tags={task.tags} size="small" />
                    </div>
                    <p className="rec-reason">
                      ✨ 推荐理由：根据你的历史记录，在「{selectedEmotion.key}
                      」时，你似乎更擅长处理这类任务。
                    </p>
                  </div>
                ))}
              </div>
            )}

            {!loading && recommendations.length === 0 && !error && (
              <p className="no-rec-text">
                暂时没有找到合适的任务。或许可以先放松一下！
              </p>
            )}

            <button
              className="back-btn"
              onClick={() => setSelectedEmotion(null)}
            >
              返回
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default RecommendationModal;
