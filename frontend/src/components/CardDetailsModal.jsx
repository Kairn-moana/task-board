import { useState, useEffect } from "react";

import "./CardDetailsModal.css";
import { syncSubtasksAPI } from "../api";

import {
  useKeyboardShortcuts,
  COMMON_SHORTCUTS,
} from "../hooks/useKeyboardShortcuts";
import { TagList, TagSelector } from "./Tag";
import SubtasksSection from "./SubtasksSection";
import RewardListModal from "./RewardListModal";

import CardMeta from "./CardMeta";

function CardDetailsModal({
  card,
  isOpen,
  onClose,
  onSave,

  boardId,
  onTagsUpdate,
}) {
  const [priority, setPriority] = useState(0);
  const [status, setStatus] = useState("Todo");
  const [dueDate, setDueDate] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [emotion, setEmotion] = useState("");
  const [subtasks, setSubtasks] = useState([]);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false); // 控制奖励弹窗的状态

  // 添加Esc键关闭模态框支持
  useKeyboardShortcuts(
    {
      closeModal: {
        ...COMMON_SHORTCUTS.ESCAPE,
        callback: () => {
          if (isOpen) {
            onClose();
          }
        },
        allowInInput: true,
      },
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (isOpen && card) {
      console.log("🔄 模态框打开，加载的卡片数据:", card); // 添加调试日志
      console.log("🔄 卡片的子任务数据:", card.subtasks);
      // 设置编辑器的内容

      setPriority(card.priority || 0);
      setStatus(card.status || "Todo");
      // 格式化日期以适应 <input type="date">
      setDueDate(
        card.due_date ? new Date(card.due_date).toISOString().split("T")[0] : ""
      );

      setEmotion(card.emotion || "");
      setSubtasks(card.subtasks || []);
    }
  }, [card, isOpen]);

  if (!isOpen) {
    return null; // 如果模态框不是打开状态，什么都不渲染
  }

  const handleStatusChange = (newStatus) => {
    const oldStatus = status;
    setStatus(newStatus);
    // 检查状态是否从“未完成”变为“完成”
    if (oldStatus !== "Done" && newStatus === "Done") {
      setIsRewardModalOpen(true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    // 2. 将卡片核心数据和子任务数据分开
    const cardUpdates = {
      priority: priority,
      status: status,
      due_date: dueDate || null, // 如果日期为空，发送 null 到后端

      emotion,
    };

    console.log("🚀 保存前的子任务状态:", subtasks); // 添加调试日志

    try {
      // 3. 首先保存子任务（重要：先保存子任务）
      const response = await syncSubtasksAPI(card.id, subtasks);
      if (response.ok) {
        const updatedSubtasks = await response.json();
        console.log("✅ 从服务器返回的子任务:", updatedSubtasks);
        setSubtasks(updatedSubtasks);
      } else {
        throw new Error("子任务保存失败");
      }

      // 4. 然后保存卡片的核心数据（这样 getCardDetails 就能获取到最新的子任务）
      await onSave(card.id, cardUpdates);

      setSaveSuccess(true);
      // 3秒后自动清除成功提示
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("保存失败:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="modal-close-btn" onClick={onClose}>
          ×
        </span>
        <h2 className="modal-card-title">{card?.title}</h2>
        {/* --- 滚动内容容器 --- */}
        <div className="modal-scrollable-content">
          {/* --- 子任务区域 --- */}
          <SubtasksSection
            subtasks={subtasks}
            setSubtasks={setSubtasks}
            cardTitle={card?.title}
            cardId={card?.id}
          />

          {/*  用新组件替换掉原来的 JSX */}
          <CardMeta
            status={status}
            setStatus={handleStatusChange}
            priority={priority}
            setPriority={setPriority}
            dueDate={dueDate}
            setDueDate={setDueDate}
            emotion={emotion}
            setEmotion={setEmotion}
          />
        </div>
        <div>
          <div className="modal-actions">
            {saveSuccess && (
              <span className="success-message">✅ 保存成功！</span>
            )}
            <button onClick={handleSave} className="save-btn" disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </div>
      {/* 渲染奖励弹窗 */}
      <RewardListModal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
      />
    </div>
  );
}

export default CardDetailsModal;
