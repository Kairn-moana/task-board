/** 子任务区域（支持模板与一步步模式）
 - props:
   - subtasks: Array<{ id, title, is_completed }>
   - setSubtasks: (next) => void
   - cardTitle: string
   - cardId?: number | string （用于本地保存一步步进度）
*/
import React, { useEffect, useMemo, useRef, useState } from "react";

// 内置模板（ADHD/ASD 友好微步）
const ROUTINE_TEMPLATES = {
  writing: {
    name: "写作（Writing Starter v1）",
    steps: [
      {
        title: "起步：打开文件，写下【标题 + 1 句目的】",
        minutes: 2,
        type: "starter",
      },
      { title: "列出 3 个要点粗纲", minutes: 5 },
      { title: "丑草稿：写出第一段，不回改", minutes: 8 },
      { title: "补 1 个例子/数据/引用", minutes: 3 },
      { title: "Quick Save + 粗排版", minutes: 1 },
      { title: "用 1 句话总结核心观点，并写下一步提示", minutes: 1 },
      { title: "收尾：打卡并从奖励清单选一个", minutes: 1, type: "reward" },
    ],
    fallback: ["写 3 句“垃圾话”热身", "列 3 个标题变体", "只写一个小节标题"],
    doneRule: "有标题 + 粗纲 + ≥1 段正文并已保存",
  },
  study: {
    name: "学习（Study Starter v1）",
    steps: [
      { title: "起步：准备定时器/资料/静音", minutes: 1, type: "starter" },
      { title: "设定本次 20 分钟目标", minutes: 1 },
      { title: "预览扫描：看目录与小结", minutes: 2 },
      { title: "主动回忆：写下你已知道的 3 点", minutes: 4 },
      { title: "练习：做 1 道题或 10 张闪卡", minutes: 8 },
      { title: "复盘：写 3 行笔记 + 1 个疑问", minutes: 3 },
      { title: "收尾：打卡并从奖励清单选一个", minutes: 1, type: "reward" },
    ],
    fallback: [
      "只做 1 道超小题",
      "读 1 段并用 1 句话复述",
      "先整理学习空间 2 分钟",
    ],
    doneRule: "完成 1 题/10 张卡 + 3 行笔记",
  },
  coding: {
    name: "编码（Coding Starter v1）",
    steps: [
      { title: "起步：打开项目并跑起来", minutes: 2, type: "starter" },
      { title: "复现问题或写 1 个失败测试", minutes: 5 },
      { title: "定位 1 个最小改动点（函数/文件）", minutes: 3 },
      { title: "实现最小改动（不求完美）", minutes: 7 },
      { title: "运行测试/构建并记录结果", minutes: 3 },
      { title: "提交 Commit（含消息模板）", minutes: 2 },
      {
        title: "收尾：推送/更新任务状态 + 写下一步提示",
        minutes: 1,
        type: "reward",
      },
    ],
    fallback: ["只加 1 条日志打印", "写最小失败测试", "把问题复述成 3 行注释"],
    doneRule: "本地可运行 + 通过测试或成功复现 + 已提交 commit",
  },
};

// 本地存储一步步状态
const routineKey = (cardId) => `routine_state_v1:${cardId || "local"}`;
const loadRoutine = (cardId) => {
  try {
    const raw = localStorage.getItem(routineKey(cardId));
    return raw
      ? JSON.parse(raw)
      : { enabled: false, current: 0, template: "writing" };
  } catch {
    return { enabled: false, current: 0, template: "writing" };
  }
};
const saveRoutine = (cardId, data) => {
  localStorage.setItem(routineKey(cardId), JSON.stringify(data));
};

const SubtasksSection = ({ subtasks, setSubtasks, cardTitle, cardId }) => {
  const [template, setTemplate] = useState("writing");
  const [routine, setRoutine] = useState(loadRoutine(cardId)); // {enabled,current,template}
  const [animTick, setAnimTick] = useState(0);
  const stepAnimEnabled =
    typeof window === "undefined"
      ? true
      : localStorage.getItem("enableStepAnimations") !== "false";

  useEffect(() => {
    // 与本地存储同步
    const next = { ...routine, template };
    setRoutine(next);
    saveRoutine(cardId, next);
  }, [template]); // eslint-disable-line

  useEffect(() => {
    saveRoutine(cardId, routine);
  }, [routine, cardId]);

  // 模板 -> 生成子任务
  const fillFromTemplate = () => {
    const t = ROUTINE_TEMPLATES[template];
    const newSubtasks = t.steps.map((s, idx) => ({
      id: Date.now() + idx + Math.random(),
      title: `${s.title}（${s.minutes} 分）`,
      is_completed: false,
    }));
    setSubtasks([...subtasks, ...newSubtasks]);
    // 将当前卡的 routine 模式切到此模板并从第一步开始
    setRoutine((r) => ({ ...r, template, current: 0 }));
  };

  // 一步步模式相关
  const visibleSteps = useMemo(() => {
    if (!routine.enabled) return subtasks;
    // 只显示当前步骤
    const i = Math.min(routine.current, subtasks.length - 1);
    return subtasks.length > 0 ? [subtasks[i]] : [];
  }, [routine, subtasks]);

  const progressText = useMemo(() => {
    if (!routine.enabled) return "";
    const total = subtasks.length || 0;
    const cur = Math.min(routine.current + 1, total || 1);
    return `步骤 ${cur} / ${total}`;
  }, [routine, subtasks.length]);

  const handleAddSubtask = (title = "") => {
    const newSubtask = { id: Date.now(), title, is_completed: false };
    setSubtasks([...subtasks, newSubtask]);
  };

  const handleSubtaskChange = (id, newTitle) => {
    setSubtasks(
      subtasks.map((task) =>
        task.id === id ? { ...task, title: newTitle } : task
      )
    );
  };

  const handleSubtaskToggle = (id) => {
    setSubtasks(
      subtasks.map((task) =>
        task.id === id ? { ...task, is_completed: !task.is_completed } : task
      )
    );
    if (routine.enabled && stepAnimEnabled) {
      setAnimTick((x) => x + 1);
    }
  };

  const handleDeleteSubtask = (id) => {
    setSubtasks(subtasks.filter((task) => task.id !== id));
  };

  const nextStep = () => {
    if (subtasks.length === 0) return;
    const idx = Math.min(routine.current, subtasks.length - 1);
    if (!subtasks[idx].is_completed) {
      // 完成当前步骤
      handleSubtaskToggle(subtasks[idx].id);
    }
    // 进入下一步
    const last = subtasks.length - 1;
    setRoutine((r) => ({ ...r, current: Math.min(idx + 1, last) }));
  };

  const prevStep = () => {
    if (subtasks.length === 0) return;
    setRoutine((r) => ({ ...r, current: Math.max(0, r.current - 1) }));
  };

  // 回车推进
  useEffect(() => {
    const onKey = (e) => {
      if (!routine.enabled) return;
      if (e.key === "Enter") {
        e.preventDefault();
        nextStep();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [routine.enabled, routine.current, subtasks]);

  // 如果卡住：展示模板的 fallback
  const fallbackList = useMemo(() => {
    const t =
      ROUTINE_TEMPLATES[routine.template || template] ||
      ROUTINE_TEMPLATES.writing;
    return t.fallback || [];
  }, [routine.template, template]);

  const doneRule = useMemo(() => {
    const t =
      ROUTINE_TEMPLATES[routine.template || template] ||
      ROUTINE_TEMPLATES.writing;
    return t.doneRule || "";
  }, [routine.template, template]);

  return (
    <div className="subtasks-section">
      <div
        className="subtasks-header"
        style={{ display: "flex", gap: 12, alignItems: "center" }}
      >
        <h3 style={{ marginRight: "auto" }}>子任务</h3>

        {/* 模板选择与填充 */}
        <label style={{ fontSize: 12, color: "#94a3b8" }}>模板</label>
        <select value={template} onChange={(e) => setTemplate(e.target.value)}>
          <option value="writing">{ROUTINE_TEMPLATES.writing.name}</option>
          <option value="study">{ROUTINE_TEMPLATES.study.name}</option>
          <option value="coding">{ROUTINE_TEMPLATES.coding.name}</option>
        </select>
        <button onClick={fillFromTemplate} className="decompose-btn">
          ✨ 从模板填充
        </button>

        {/* 一步步模式开关 */}
        <label style={{ fontSize: 12, color: "#94a3b8", marginLeft: 8 }}>
          一步步模式
        </label>
        <input
          type="checkbox"
          checked={!!routine.enabled}
          onChange={(e) =>
            setRoutine((r) => ({ ...r, enabled: e.target.checked }))
          }
        />
      </div>

      {/* 一步步模式：仅显示当前步骤 + 控制条 */}
      {routine.enabled && (
        <div
          style={{
            margin: "8px 0 12px",
            padding: 8,
            border: "1px solid #334155",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <strong>{progressText}</strong>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button className="btn" onClick={prevStep}>
                上一步
              </button>
              <button className="btn" onClick={nextStep}>
                下一步（Enter）
              </button>
            </div>
          </div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>
            如果卡住：{fallbackList.join(" / ")}
          </div>
          {doneRule && (
            <div style={{ color: "#94a3b8", fontSize: 12 }}>
              完成判定：{doneRule}
            </div>
          )}
        </div>
      )}

      {/* 列表（在一步步模式下只渲染当前步骤） */}
      <div className="subtasks-list">
        {visibleSteps.map((task) => (
          <div
            key={task.id}
            className={`subtask-item ${task.is_completed ? "done" : ""} ${
              stepAnimEnabled ? "step-complete-anim-" + animTick : ""
            }`}
          >
            <input
              type="checkbox"
              checked={task.is_completed}
              onChange={() => handleSubtaskToggle(task.id)}
            />
            <input
              type="text"
              value={task.title}
              onChange={(e) => handleSubtaskChange(task.id, e.target.value)}
              className={`subtask-title ${task.is_completed ? "done" : ""}`}
            />
            {!routine.enabled && (
              <button
                onClick={() => handleDeleteSubtask(task.id)}
                className="delete-subtask-btn"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {!routine.enabled && (
        <button onClick={() => handleAddSubtask()} className="add-subtask-btn">
          + 添加子任务
        </button>
      )}
    </div>
  );
};

export default SubtasksSection;
