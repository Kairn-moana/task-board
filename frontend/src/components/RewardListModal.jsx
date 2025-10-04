import React, { useState, useEffect } from "react";
import "./Modal.css";
import {
  getRewardSuggestion,
  logRewardRedemption,
} from "../api/services/rewardService";
import "./RewardListModal.css";

// 1. 定义一个带有默认模板的奖励列表
const DEFAULT_REWARDS = [
  // 轻微奖励
  {
    id: 1,
    text: "听一首最喜欢的歌",
    tag: "放空",
    weight: "轻微奖励",
    claimed: false,
  },
  {
    id: 2,
    text: "吃一块小零食",
    tag: "吃的",
    weight: "轻微奖励",
    claimed: false,
  },
  // 中度奖励
  {
    id: 3,
    text: "看一集 20 分钟的剧",
    tag: "玩的",
    weight: "中度奖励",
    claimed: false,
  },
  {
    id: 4,
    text: "和朋友聊 10 分钟天",
    tag: "社交",
    weight: "中度奖励",
    claimed: false,
  },
  // 大奖励
  { id: 5, text: "打一局游戏", tag: "玩的", weight: "大奖励", claimed: false },
  {
    id: 6,
    text: "点一份喜欢的外卖",
    tag: "吃的",
    weight: "大奖励",
    claimed: false,
  },
];

// 按“轻重”对奖励进行分组的辅助函数
const groupByWeight = (items) => {
  const groups = { 轻微奖励: [], 中度奖励: [], 大奖励: [] };
  items.forEach((item) => {
    if (groups[item.weight]) {
      groups[item.weight].push(item);
    }
  });
  return groups;
};

const RewardListModal = ({ isOpen, onClose, cardId }) => {
  const [suggestion, setSuggestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);

  const fetchSuggestion = async () => {
    setIsLoading(true);
    try {
      const data = await getRewardSuggestion();
      setSuggestion(data);
    } catch (error) {
      console.error("无法获取奖励建议");
      setSuggestion(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSuggestion();
      setIsClaimed(false);
    }
  }, [isOpen]);

  const handleClaim = () => {
    if (!suggestion?.suggestion) return;
    logRewardRedemption({
      reward_item_id: suggestion.suggestion.id,
      card_id: cardId,
    });
    setIsClaimed(true);
  };

  const handleDrawAgain = () => {
    // 重新获取建议
    fetchSuggestion();
    setIsClaimed(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content reward-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="close-button">
          ×
        </button>
        <h2>🎉 恭喜完成任务！</h2>
        <p>给自己一个奖励吧！</p>

        <div className="suggestion-box">
          {isLoading ? (
            <p>正在为你挑选奖励...</p>
          ) : suggestion?.suggestion ? (
            <>
              <h3>{suggestion.suggestion.title}</h3>
              <p>{suggestion.suggestion.description}</p>
            </>
          ) : (
            <p>暂时没有可用的奖励。</p>
          )}
        </div>

        {isClaimed ? (
          <div className="claimed-message">
            <p>奖励已领取！✨</p>
          </div>
        ) : (
          <div className="modal-actions">
            <button
              onClick={handleClaim}
              className="claim-button"
              disabled={!suggestion?.suggestion}
            >
              就这个了！
            </button>
            {suggestion?.is_fallback && (
              <button onClick={handleDrawAgain} className="draw-again-button">
                随机抽取
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardListModal;
