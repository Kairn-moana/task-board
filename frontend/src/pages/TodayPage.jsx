import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SummaryWidget from "../components/SummaryWidget";
import EmotionQuickLog from "../components/EmotionQuickLog";
import { getTodaysEmotionLogs } from "../api";

const LS_KEY = "today_lists_v1";
const SORT_SEEN_KEY = "today_sort_seen_date";
const LIMITS = { now: 1, next: 2, later: 3 };

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { now: [], next: [], later: [], inbox: [], cards: {} };
    return JSON.parse(raw);
  } catch {
    return { now: [], next: [], later: [], inbox: [], cards: {} };
  }
}
function saveState(s) {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}

export default function TodayPage() {
  const [state, setState] = useState(loadState);
  const [title, setTitle] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [showSorter, setShowSorter] = useState(false);
  const [presetMin, setPresetMin] = useState(20);
  const [todaysLogs, setTodaysLogs] = useState([]);
  const [showQuickLog, setShowQuickLog] = useState(false);

  const [focusActive, setFocusActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [focusStartTime, setFocusStartTime] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [completedTaskId, setCompletedTaskId] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // 组件加载时获取今天的情绪记录
  useEffect(() => {
    async function fetchTodaysLogs() {
      try {
        const logs = await getTodaysEmotionLogs();
        setTodaysLogs(logs);
      } catch (error) {
        console.error("无法获取今日情绪记录:", error);
      }
    }
    fetchTodaysLogs();
  }, []);

  // 列计数与是否超限
  const counts = useMemo(
    () => ({
      now: state.now.length,
      next: state.next.length,
      later: state.later.length,
      inbox: state.inbox.length,
    }),
    [state]
  );
  const over = {
    now: counts.now > LIMITS.now,
    next: counts.next > LIMITS.next,
    later: counts.later > LIMITS.later,
  };

  // 每日第一次弹分拣抽屉（30s 自动关闭）
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const seen = localStorage.getItem(SORT_SEEN_KEY);
    if (seen !== today && state.inbox.length > 0) {
      setShowSorter(true);
      localStorage.setItem(SORT_SEEN_KEY, today);
      const t = setTimeout(() => setShowSorter(false), 30000);
      return () => clearTimeout(t);
    }
  }, [state.inbox.length]);

  // 键盘操作：N 新建；1/2/3 移列；Enter 打开详情
  useEffect(() => {
    function onKey(e) {
      if (e.key === "n" || e.key === "N") {
        inputRef.current?.focus();
        e.preventDefault();
        return;
      }
      if (!selectedId) return;
      if (["1", "2", "3"].includes(e.key)) {
        const map = { 1: "now", 2: "next", 3: "later" };
        const to = map[e.key];
        const from = findCol(selectedId);
        if (from) move(selectedId, from, to);
        e.preventDefault();
      }
      if (e.key === "Enter") {
        openEditor(selectedId);
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, state]);

  function findCol(id) {
    if (state.now.includes(id)) return "now";
    if (state.next.includes(id)) return "next";
    if (state.later.includes(id)) return "later";
    if (state.inbox.includes(id)) return "inbox";
    return null;
  }

  function addCard() {
    if (!title.trim()) return;
    const id = Date.now().toString();
    const card = {
      id,
      title: title.trim(),
      status: "todo",
      nextStep: "",
      dueAt: "",
    };
    const next = {
      ...state,
      inbox: [id, ...state.inbox],
      cards: { ...state.cards, [id]: card },
    };
    saveState(next);
    setState(next);
    setTitle("");
    setSelectedId(id);
  }

  function updateCard(id, patch) {
    const card = { ...state.cards[id], ...patch };
    const next = { ...state, cards: { ...state.cards, [id]: card } };
    saveState(next);
    setState(next);
  }

  function move(id, from, to) {
    if (from === to) return;
    const rm = state[from].filter((x) => x !== id);
    const next = { ...state, [from]: rm, [to]: [id, ...state[to]] };
    saveState(next);
    setState(next);
  }

  function startQuickTarget(minutes) {
    // 默认选中 Now 列第一张；若有选中卡片则使用选中卡
    const id =
      selectedId ||
      state.now[0] ||
      state.next[0] ||
      state.later[0] ||
      state.inbox[0];
    if (!id) return;
    startQuick(id, minutes);
  }

  function startQuick(id, minutes = 20) {
    const card = state.cards[id];
    const q = new URLSearchParams({
      cardId: id,
      title: card?.title || "",
      next: card?.nextStep || "",
      dur: String(minutes),
    });
    navigate(`/focus?${q.toString()}`);
  }

  function openEditor(id) {
    const c = state.cards[id];
    const nextStep = prompt("下一步（可选）", c?.nextStep || "");
    if (nextStep === null) return;
    const dueAt = prompt("截止日期 YYYY-MM-DD（可留空）", c?.dueAt || "");
    updateCard(id, { nextStep, dueAt });
  }

  const getCard = (id) => state.cards[id];

  // 当 EmotionQuickLog 记录成功时，更新列表
  const handleLogSuccess = (newLog) => {
    setTodaysLogs([newLog, ...todaysLogs]);
  };

  const handleWidgetClick = () => {
    if (todaysLogs.length > 0) {
      navigate("/emotion-diary?filter=today");
    } else {
      setShowQuickLog(true);
    }
  };

  // 倒计时功能
  useEffect(() => {
    if (focusActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setFocusActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [focusActive, timeRemaining]);

  // 格式化剩余时间为 MM:SS 格式
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // 开始专注的增强版本
  function startQuickTarget(minutes) {
    const id =
      selectedId ||
      state.now[0] ||
      state.next[0] ||
      state.later[0] ||
      state.inbox[0];
    if (!id) return;

    // 是否使用全屏专注模式
    const useFullScreen = window.confirm(
      `是否进入全屏专注模式？\n\n点击"确定"进入全屏模式\n点击"取消"使用简易计时器`
    );

    if (useFullScreen) {
      // 原有的全屏专注模式
      startQuick(id, minutes);
    } else {
      // 新的简易计时器模式
      setFocusActive(true);
      setTimeRemaining(minutes * 60);
      setFocusStartTime(new Date());

      // 如果是从其他列选择的任务，自动移到 Now
      const column = findCol(id);
      if (column && column !== "now") {
        move(id, column, "now");
      }
    }
  }

  // 停止专注
  function stopFocus() {
    if (!focusActive) return;

    if (window.confirm("确定要停止当前专注吗？")) {
      clearInterval(timerRef.current);
      setFocusActive(false);
      setTimeRemaining(0);

      // 可以记录中断的专注
      const focusedMinutes = Math.round((new Date() - focusStartTime) / 60000);
      console.log(`专注中断，已完成 ${focusedMinutes} 分钟`);
      // 这里可以添加记录中断专注的逻辑
    }
  }

  // 完成任务
  function completeTask(id) {
    // 记录完成的任务ID，用于触发动画
    setCompletedTaskId(id);
    setShowConfetti(true);

    // 3秒后清除动画状态
    setTimeout(() => {
      setCompletedTaskId(null);
      setShowConfetti(false);

      // 从状态中移除任务
      const column = findCol(id);
      if (column) {
        const newState = {
          ...state,
          [column]: state[column].filter((taskId) => taskId !== id),
        };
        saveState(newState);
        setState(newState);
      }
    }, 3000);
  }

  // 拖拽相关函数
  function handleDragStart(e, id) {
    setDraggedTaskId(id);
    e.dataTransfer.setData("text/plain", id);
    // 设置拖拽时的视觉效果
    e.dataTransfer.effectAllowed = "move";

    // 如果浏览器支持，设置拖拽图像
    if (e.dataTransfer.setDragImage) {
      const elem = document.getElementById(`task-${id}`);
      if (elem) {
        const crt = elem.cloneNode(true);
        crt.style.opacity = "0.8";
        crt.style.position = "absolute";
        crt.style.top = "-1000px";
        document.body.appendChild(crt);
        e.dataTransfer.setDragImage(crt, 20, 20);
        setTimeout(() => document.body.removeChild(crt), 0);
      }
    }
  }

  function handleDragOver(e, columnType) {
    e.preventDefault();
    setDragOverColumn(columnType);
  }

  function handleDrop(e, targetColumn) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedTaskId;
    const sourceColumn = findCol(id);

    if (id && sourceColumn && sourceColumn !== targetColumn) {
      move(id, sourceColumn, targetColumn);
    }

    setDraggedTaskId(null);
    setDragOverColumn(null);
  }

  function handleDragEnd() {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  }

  const Column = ({ type, title }) => {
    // 根据类型设置颜色主题
    const colorTheme = {
      now: {
        accent: "#f59e0b", // 橙黄色
        light: "rgba(245, 158, 11, 0.1)",
        border: "rgba(245, 158, 11, 0.3)",
        icon: "🔆",
      },
      next: {
        accent: "#3b82f6", // 蓝色
        light: "rgba(59, 130, 246, 0.1)",
        border: "rgba(59, 130, 246, 0.3)",
        icon: "⏱️",
      },
      later: {
        accent: "#6b7280", // 灰色
        light: "rgba(107, 114, 128, 0.1)",
        border: "rgba(107, 114, 128, 0.3)",
        icon: "📅",
      },
    };
    const theme = colorTheme[type] || colorTheme.later;

    // 容量指示器
    const renderCapacityIndicator = () => {
      const total = LIMITS[type] || 5;
      const current = counts[type];
      const isOverLimit = current > total;

      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginLeft: "8px",
            position: "relative",
          }}
          title={
            isOverLimit
              ? `已超出上限（${current}/${total}）`
              : `容量：${current}/${total}`
          }
        >
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor:
                  i < current
                    ? isOverLimit
                      ? "#ef4444"
                      : theme.accent
                    : "rgba(107, 114, 128, 0.2)",
                transition: "background-color 0.3s",
              }}
            />
          ))}
          {isOverLimit && (
            <span
              style={{
                fontSize: "10px",
                color: "#ef4444",
                fontWeight: "500",
              }}
            >
              +{current - total}
            </span>
          )}
        </div>
      );
    };

    return (
      <div
        style={{
          flex: 1,
          backgroundColor: "var(--background-content)",
          borderRadius: "12px",
          border:
            dragOverColumn === type
              ? `2px dashed ${theme.accent}`
              : `1px solid ${theme.border}`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: "400px",
          transition: "border 0.2s, transform 0.2s",
          transform: dragOverColumn === type ? "scale(1.01)" : "scale(1)",
        }}
        onDragOver={(e) => handleDragOver(e, type)}
        onDrop={(e) => handleDrop(e, type)}
      >
        {/* 标题栏 */}
        <div
          style={{
            backgroundColor: theme.light,
            padding: "12px 16px",
            borderBottom: `1px solid ${theme.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "18px" }}>{theme.icon}</span>
            <h3
              style={{
                margin: 0,
                color: theme.accent,
                fontWeight: "600",
                fontSize: "16px",
              }}
            >
              {title}
            </h3>
            {renderCapacityIndicator()}
          </div>
        </div>

        {/* 任务列表 */}
        <div
          style={{
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            flex: 1,
            overflowY: "auto",
          }}
        >
          {state[type].length === 0 ? (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "var(--text-secondary)",
                fontSize: "14px",
                backgroundColor: "var(--background-hover)",
                borderRadius: "8px",
                border: "1px dashed var(--border-primary)",
              }}
            >
              没有任务
            </div>
          ) : (
            state[type].map((id) => {
              const c = getCard(id);
              const selected = id === selectedId;
              const isCompleting = id === completedTaskId;

              return (
                <div
                  id={`task-${id}`}
                  key={id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setSelectedId(id)}
                  style={{
                    backgroundColor: selected
                      ? `${theme.light}`
                      : "var(--background-content)",
                    color: "var(--text-primary)",
                    borderRadius: "10px",
                    border: selected
                      ? `1px solid ${theme.accent}`
                      : "1px solid var(--border-primary)",
                    overflow: "hidden",
                    transition: "transform 0.3s, box-shadow 0.3s, opacity 0.5s",
                    boxShadow: selected
                      ? `0 2px 8px ${theme.light}`
                      : "0 1px 3px rgba(0,0,0,0.05)",
                    cursor: "grab",
                    opacity: isCompleting ? "0.6" : "1",
                    transform: isCompleting
                      ? "translateY(-10px)"
                      : "translateY(0)",
                    position: "relative",
                  }}
                  title={`${c?.nextStep ? `下一步: ${c.nextStep}` : ""}${
                    c?.nextStep && c?.dueAt ? " · " : ""
                  }${c?.dueAt ? `截止: ${c.dueAt}` : ""}`}
                >
                  {/* 完成任务时的彩带效果 */}
                  {isCompleting && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: "rgba(16, 185, 129, 0.2)",
                        animation: "flash 0.8s ease-in-out infinite",
                        borderRadius: "10px",
                        zIndex: 1,
                        pointerEvents: "none",
                      }}
                    />
                  )}

                  {/* 完成标记 */}
                  {isCompleting && (
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        backgroundColor: "#10B981",
                        color: "white",
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "28px",
                        fontWeight: "bold",
                        boxShadow: "0 0 20px rgba(16, 185, 129, 0.8)",
                        zIndex: 2,
                        animation: "scale-in 0.5s ease-out",
                      }}
                    >
                      ✓
                    </div>
                  )}

                  {/* 任务内容 */}
                  <div
                    style={{
                      padding: "12px 16px",
                      opacity: isCompleting ? 0.3 : 1,
                      position: "relative",
                      zIndex: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "15px",
                          flex: 1,
                        }}
                      >
                        {c?.title}
                      </span>

                      {/* 截止日期小标记，只在有截止日期时显示 */}
                      {c?.dueAt && (
                        <div
                          style={{
                            fontSize: "11px",
                            backgroundColor:
                              new Date(c.dueAt) < new Date()
                                ? "rgba(239, 68, 68, 0.1)"
                                : "rgba(107, 114, 128, 0.1)",
                            color:
                              new Date(c.dueAt) < new Date()
                                ? "#ef4444"
                                : "var(--text-secondary)",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {new Date(c.dueAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      )}

                      {/* 菜单按钮 */}

                      <button
                        className="menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          // 显示操作菜单
                          const menuOptions = [
                            { label: "编辑", action: () => openEditor(id) },
                            { label: "完成", action: () => completeTask(id) },
                            {
                              label: "删除",
                              action: () => {
                                if (window.confirm("确定要删除这个任务吗？")) {
                                  const col = findCol(id);
                                  if (col) {
                                    const newState = {
                                      ...state,
                                      [col]: state[col].filter(
                                        (taskId) => taskId !== id
                                      ),
                                    };
                                    saveState(newState);
                                    setState(newState);
                                  }
                                }
                              },
                            },
                          ];

                          if (type !== "now") {
                            menuOptions.unshift({
                              label: "移到 Now",
                              action: () => move(id, type, "now"),
                            });
                          }

                          // 简单的菜单实现
                          const option = window.prompt(
                            `选择操作：\n${menuOptions
                              .map((opt, i) => `${i + 1}. ${opt.label}`)
                              .join("\n")}`,
                            "1"
                          );

                          const index = parseInt(option) - 1;
                          if (
                            !isNaN(index) &&
                            index >= 0 &&
                            index < menuOptions.length
                          ) {
                            menuOptions[index].action();
                          }
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          borderRadius: "4px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        ⋯
                      </button>
                    </div>

                    {/* 任务详情 */}
                    {(c?.nextStep || c?.dueAt) && (
                      <div
                        style={{
                          fontSize: "13px",
                          color: "var(--text-secondary)",
                          marginBottom: "10px",
                        }}
                      >
                        {c?.nextStep && (
                          <div style={{ marginBottom: "4px" }}>
                            <span style={{ opacity: 0.7 }}>下一步：</span>{" "}
                            {c.nextStep}
                          </div>
                        )}
                        {c?.dueAt && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span style={{ opacity: 0.7 }}>截止：</span>
                            <span
                              style={{
                                color:
                                  new Date(c.dueAt) < new Date()
                                    ? "#ef4444"
                                    : "inherit",
                                fontWeight:
                                  new Date(c.dueAt) < new Date()
                                    ? "500"
                                    : "normal",
                              }}
                            >
                              {c.dueAt}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 操作按钮区 */}
                  <div
                    style={{
                      borderTop: "1px solid var(--border-primary)",
                      padding: "8px",
                      backgroundColor: "var(--background-hover)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                      opacity: isCompleting ? 0.3 : 1,
                      position: "relative",
                      zIndex: 0,
                    }}
                  >
                    {/* 主操作按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startQuick(id, presetMin);
                      }}
                      style={{
                        backgroundColor: theme.accent,
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "14px",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        cursor: "pointer",
                        flex: 1,
                      }}
                    >
                      <span>▶</span>
                      <span>开始专注</span>
                    </button>

                    {/* 完成任务按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        completeTask(id);
                      }}
                      style={{
                        backgroundColor: "transparent",
                        color: "#10B981",
                        border: "1px solid #10B981",
                        borderRadius: "6px",
                        padding: "6px",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                      title="完成任务"
                    >
                      ✓
                    </button>

                    {/* 次要操作 - 简化为图标 */}
                    {type !== "now" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          move(id, type, "now");
                        }}
                        style={{
                          backgroundColor: "transparent",
                          color: "#f59e0b",
                          border: "1px solid #f59e0b",
                          borderRadius: "6px",
                          padding: "6px",
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          cursor: "pointer",
                        }}
                        title="移到 Now"
                      >
                        ⏩
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 添加任务按钮 */}
        <div style={{ padding: "12px" }}>
          <button
            onClick={() => {
              inputRef.current?.focus();
              // 这里可以添加直接添加到特定列的逻辑
            }}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: theme.light,
              color: theme.accent,
              border: `1px dashed ${theme.border}`,
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span>+</span>
            <span>添加任务到 {title}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{ padding: 16, display: "flex", flexDirection: "column", gap: 24 }}
    >
      {/* 区块 1: 情绪 & 今日状态（轻量化，顶部小模块） */}
      <section
        className="emotion-status-section"
        style={{
          backgroundColor: "var(--background-content)",
          borderRadius: "12px",
          padding: "12px 16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          width: "100%",
        }}
      >
        {/* 今日情绪条 */}
        <div
          className="emotion-widget"
          style={{
            cursor: "pointer",
            padding: "10px 16px",
            backgroundColor: "var(--background-hover)",
            borderRadius: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            transition: "transform 0.2s, box-shadow 0.2s", // 添加过渡效果
            position: "relative",
            overflow: "hidden",
          }}
          onClick={handleWidgetClick}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontWeight: "500" }}>今日心情</span>

            <div style={{ display: "flex", gap: "8px" }}>
              {["😊", "😐", "😔", "😡", "🥳"].map((emoji, index) => (
                <button
                  key={index}
                  className="emoji-btn"
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.2s, background-color 0.2s",
                    position: "relative",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQuickLog(true);
                    // 添加点击动画效果
                    const btn = e.currentTarget;
                    btn.style.transform = "scale(1.2)";
                    btn.style.backgroundColor = "rgba(99, 102, 241, 0.2)";
                    setTimeout(() => {
                      btn.style.transform = "scale(1)";
                      btn.style.backgroundColor = "transparent";
                    }, 300);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            {todaysLogs && todaysLogs.length > 0 ? (
              <span
                style={{ fontSize: "14px", color: "var(--text-secondary)" }}
              >
                今日已记录 <b>{todaysLogs.length}</b> 次
              </span>
            ) : (
              <span
                style={{ fontSize: "14px", color: "var(--text-secondary)" }}
              >
                点击记录今日心情
              </span>
            )}
          </div>
        </div>

        {/* 情绪快速记录组件 - 仅在需要时显示  */}
        {showQuickLog && (
          <div style={{ marginTop: "12px" }}>
            <EmotionQuickLog
              onLogSuccess={(newLog) => {
                handleLogSuccess(newLog);
                setShowQuickLog(false); // 记录成功后自动隐藏
              }}
            />
          </div>
        )}
      </section>
      {/* 区块 2: 专注 & 统计区（核心操作区，放在中间，突出） */}
      <section
        className="focus-stats-section"
        style={{
          backgroundColor: "var(--background-content)",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>专注与统计</h2>

        <div
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "stretch",
          }}
        >
          {/* 左侧：3个统计数据小卡片 */}
          <div
            style={{
              flex: "1",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {/* 统计卡片1：起步次数 */}
            <div
              style={{
                backgroundColor: "var(--background-hover)",
                borderRadius: "10px",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                height: "calc(33% - 8px)",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  marginBottom: "4px",
                }}
              >
                今日起步次数
              </span>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "var(--text-accent)",
                  }}
                >
                  {todaysLogs.length || 0}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    marginLeft: "4px",
                    color: "var(--text-secondary)",
                  }}
                >
                  次
                </span>
              </div>
            </div>

            {/* 统计卡片2：专注分钟 */}
            <div
              style={{
                backgroundColor: "var(--background-hover)",
                borderRadius: "10px",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                height: "calc(33% - 8px)",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  marginBottom: "4px",
                }}
              >
                今日专注时间
              </span>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "var(--text-accent)",
                  }}
                >
                  {120} {/* 这里应该替换为实际的专注分钟数 */}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    marginLeft: "4px",
                    color: "var(--text-secondary)",
                  }}
                >
                  分钟
                </span>
              </div>
            </div>

            {/* 统计卡片3：完成任务数 */}
            <div
              style={{
                backgroundColor: "var(--background-hover)",
                borderRadius: "10px",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                height: "calc(33% - 8px)",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  marginBottom: "4px",
                }}
              >
                今日完成任务
              </span>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "var(--text-accent)",
                  }}
                >
                  {3} {/* 这里应该替换为实际的完成任务数 */}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    marginLeft: "4px",
                    color: "var(--text-secondary)",
                  }}
                >
                  项
                </span>
              </div>
            </div>
          </div>

          {/* 右侧：专注按钮大卡片 */}
          <div
            style={{
              flex: "1.5",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {/* 专注按钮卡片 */}
            <div
              style={{
                backgroundColor: focusActive
                  ? "#10b981"
                  : "var(--accent-primary)", // 专注中使用绿色
                borderRadius: "12px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                flex: "1",
                transition: "background-color 0.3s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    color: "white",
                    fontSize: "20px",
                    fontWeight: "600",
                  }}
                >
                  {focusActive ? "专注进行中" : "立即开始专注"}
                </h3>

                {!focusActive && (
                  <select
                    value={presetMin}
                    onChange={(e) => setPresetMin(Number(e.target.value))}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                      fontWeight: "500",
                      cursor: "pointer",
                    }}
                  >
                    <option value={20}>20分钟</option>
                    <option value={30}>30分钟</option>
                    <option value={45}>45分钟</option>
                  </select>
                )}
              </div>

              {focusActive ? (
                // 专注中状态 - 显示倒计时
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  {/* 倒计时显示 */}
                  <div
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      borderRadius: "12px",
                      padding: "16px",
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "36px",
                        fontWeight: "bold",
                        color: "white",
                        fontFamily: "monospace",
                        letterSpacing: "2px",
                      }}
                    >
                      ⏳ {formatTimeRemaining()}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "rgba(255, 255, 255, 0.8)",
                        marginTop: "8px",
                      }}
                    >
                      预计{" "}
                      {new Date(
                        Date.now() + timeRemaining * 1000
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      完成
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${
                          100 - (timeRemaining / (presetMin * 60)) * 100
                        }%`,
                        backgroundColor: "white",
                        borderRadius: "4px",
                        transition: "width 1s linear",
                      }}
                    />
                  </div>

                  {/* 停止按钮 */}
                  <button
                    onClick={stopFocus}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                      border: "1px solid rgba(255, 255, 255, 0.4)",
                      borderRadius: "8px",
                      padding: "10px 16px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    停止专注
                  </button>
                </div>
              ) : (
                // 未专注状态 - 显示开始按钮
                <button
                  onClick={() => startQuickTarget(presetMin)}
                  style={{
                    backgroundColor: "white",
                    color: "var(--accent-primary)",
                    padding: "16px",
                    borderRadius: "10px",
                    border: "none",
                    fontSize: "18px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                  onMouseDown={(e) =>
                    (e.currentTarget.style.transform = "scale(0.98)")
                  }
                  onMouseUp={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <span style={{ fontSize: "24px" }}>▶️</span>
                  <span>开始 {presetMin} 分钟专注</span>
                </button>
              )}

              {/* 预计完成时间 - 仅在非专注状态显示 */}
              {!focusActive && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "14px",
                  }}
                >
                  <span>预计完成时间</span>
                  <span>
                    {new Date(
                      Date.now() + presetMin * 60 * 1000
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* 黄金起步提示 */}
            <div
              style={{
                backgroundColor: "rgba(251, 191, 36, 0.15)",
                borderRadius: "8px",
                padding: "12px 16px",
                borderLeft: "4px solid #fbbf24",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "20px" }}>💡</span>
              <div>
                <p
                  style={{
                    margin: "0 0 4px 0",
                    fontWeight: "500",
                    color: "#92400e",
                  }}
                >
                  黄金起步时段
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    color: "#92400e",
                  }}
                >
                  早上9:00-11:00是你的高效时段，建议优先处理重要任务
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 快速收集输入框 - 移到底部 */}
        <div
          style={{
            marginTop: "16px",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <input
            ref={inputRef}
            placeholder="快速收集（回车加入收件箱）"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCard()}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 12,
              border: "1px solid #334155",
            }}
          />
        </div>
      </section>
      。{/* 区块 3: 任务三栏：Now / Next / Later（任务操作区，底部占满） */}
      <section
        className="tasks-section"
        style={{
          padding: "16px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>任务管理</h2>

        <div
          style={{
            display: "flex",
            gap: "16px",
            height: "100%",
            minHeight: "400px",
          }}
        >
          {/* 三个主要任务列 */}
          <Column type="now" title="Now" />
          <Column type="next" title="Next" />
          <Column type="later" title="Later" />
        </div>

        {/* 收件箱区域 */}
        <div
          style={{
            marginTop: "16px",
            backgroundColor: "var(--background-content)",
            borderRadius: "12px",
            border: "1px solid var(--border-primary)",
            overflow: "hidden",
          }}
        >
          {/* 收件箱标题 */}
          <div
            style={{
              backgroundColor: "var(--background-hover)",
              padding: "12px 16px",
              borderBottom: "1px solid var(--border-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "18px" }}>📥</span>
              <h3
                style={{
                  margin: 0,
                  fontWeight: "600",
                  fontSize: "16px",
                }}
              >
                收件箱
              </h3>
              <span
                style={{
                  backgroundColor: "var(--text-secondary)",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "500",
                  padding: "2px 8px",
                  borderRadius: "10px",
                }}
              >
                {counts.inbox}
              </span>
            </div>

            <button
              onClick={() => setShowSorter(true)}
              style={{
                backgroundColor: "var(--background-content)",
                border: "1px solid var(--border-primary)",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              批量分拣
            </button>
          </div>

          {/* 收件箱内容 */}
          <div
            style={{
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {state.inbox.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                }}
              >
                收件箱为空
              </div>
            ) : (
              state.inbox.map((id) => {
                const c = getCard(id);
                return (
                  <div
                    key={id}
                    style={{
                      backgroundColor: "var(--background-content)",
                      borderRadius: "8px",
                      border: "1px solid var(--border-primary)",
                      padding: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span style={{ flex: 1, fontWeight: "500" }}>
                      {c?.title}
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn"
                        onClick={() => move(id, "inbox", "now")}
                        style={{
                          backgroundColor: "var(--background-hover)",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "14px",
                          cursor: "pointer",
                          color: "#f59e0b",
                        }}
                      >
                        Now
                      </button>
                      <button
                        className="btn"
                        onClick={() => move(id, "inbox", "next")}
                        style={{
                          backgroundColor: "var(--background-hover)",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "14px",
                          cursor: "pointer",
                          color: "#3b82f6",
                        }}
                      >
                        Next
                      </button>
                      <button
                        className="btn"
                        onClick={() => move(id, "inbox", "later")}
                        style={{
                          backgroundColor: "var(--background-hover)",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "14px",
                          cursor: "pointer",
                          color: "#6b7280",
                        }}
                      >
                        Later
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
      {/* 每日分拣弹窗 - 样式优化 */}
      {showSorter && (
        <div
          onClick={() => setShowSorter(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 640,
              maxWidth: "90vw",
              backgroundColor: "var(--background-content)",
              color: "var(--text-primary)",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            {/* 弹窗标题 */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-primary)",
                backgroundColor: "var(--background-hover)",
              }}
            >
              <h3 style={{ margin: 0, fontWeight: "600" }}>每日分拣</h3>
              <p
                style={{
                  margin: "8px 0 0 0",
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                }}
              >
                把收件箱里的条目放到 Now/Next/Later（30 秒后自动关闭）
              </p>
            </div>

            {/* 弹窗内容 */}
            <div
              style={{
                padding: "16px 20px",
                maxHeight: "50vh",
                overflow: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {state.inbox.map((id) => {
                  const c = getCard(id);
                  return (
                    <div
                      key={id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px",
                        borderRadius: "8px",
                        backgroundColor: "var(--background-hover)",
                      }}
                    >
                      <span style={{ flex: 1, fontWeight: "500" }}>
                        {c?.title}
                      </span>
                      <button
                        className="btn"
                        onClick={() => move(id, "inbox", "now")}
                        style={{
                          backgroundColor: "#f59e0b",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "8px 16px",
                          fontWeight: "500",
                          cursor: "pointer",
                        }}
                      >
                        Now
                      </button>
                      <button
                        className="btn"
                        onClick={() => move(id, "inbox", "next")}
                        style={{
                          backgroundColor: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "8px 16px",
                          fontWeight: "500",
                          cursor: "pointer",
                        }}
                      >
                        Next
                      </button>
                      <button
                        className="btn"
                        onClick={() => move(id, "inbox", "later")}
                        style={{
                          backgroundColor: "#6b7280",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "8px 16px",
                          fontWeight: "500",
                          cursor: "pointer",
                        }}
                      >
                        Later
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 弹窗底部 */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid var(--border-primary)",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btn"
                onClick={() => setShowSorter(false)}
                style={{
                  backgroundColor: "var(--accent-primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 彩带动画容器 - 当有任务完成时显示 */}
      {showConfetti && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 10}px`,
                backgroundColor: [
                  "#10B981", // 绿色
                  "#3B82F6", // 蓝色
                  "#F59E0B", // 橙色
                  "#EF4444", // 红色
                  "#8B5CF6", // 紫色
                ][i % 5],
                borderRadius: "2px",
                top: `${Math.random() * 20}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.8 + 0.2,
                animation: `confetti-fall ${
                  Math.random() * 2 + 1
                }s ease-out forwards`,
              }}
            />
          ))}
        </div>
      )}
      {/* CSS 动画定义 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
      @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 0.2; }
        100% { opacity: 0.6; }
      }
      
      @keyframes scale-in {
        0% { transform: scale(0); }
        70% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
      
      @keyframes confetti-fall {
        0% { 
          transform: translateY(-10px) rotate(0deg); 
          opacity: 1;
        }
        100% { 
          transform: translateY(100vh) rotate(${Math.random() * 360}deg); 
          opacity: 0;
        }
      }
      
      @keyframes flash {
        0%, 100% { background-color: rgba(16, 185, 129, 0.2); }
        50% { background-color: rgba(16, 185, 129, 0.6); }
      }
    `,
        }}
      />
    </div>
  );
}
