import { useState } from "react";
import Timer from "./Timer";
import "./FocusSession.css";

const WORK_DURATION = 25 * 60; // 25 minutes
const BREAK_DURATION = 5 * 60; // 5 minutes

function FocusSession({ tasks, onEndSession }) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [sessionType, setSessionType] = useState("work"); // 'work' or 'break'
  const [isRunning, setIsRunning] = useState(true);

  const currentTask = tasks[currentTaskIndex];

  const handleTimerComplete = () => {
    setIsRunning(false);
    if (sessionType === "work") {
      onEndSession(currentTask);
      // This will close the focus session. The break can be taken outside of it.
    }
  };

  const handleSkipToEnd = () => {
    onEndSession(currentTask, true); // true indicates skipping
  };

  if (!currentTask) {
    return (
      <div className="focus-session-container">
        <div className="focus-content">
          <h2>🎉</h2>
          <h1>今日任务已全部完成!</h1>
          <button
            className="end-session-btn"
            onClick={() => onEndSession(null, true)}
          >
            退出专注模式
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="focus-session-container">
      <div className="focus-header">
        <span className={`session-indicator ${sessionType}`}>
          {sessionType === "work" ? "🍅 专注时间" : "☕️ 休息一下"}
        </span>
      </div>
      <div className="focus-content">
        <Timer
          duration={sessionType === "work" ? WORK_DURATION : BREAK_DURATION}
          onComplete={handleTimerComplete}
          isRunning={isRunning}
        />
        {sessionType === "work" && (
          <h1 className="focused-task-title">{currentTask.title}</h1>
        )}
      </div>
      <div className="focus-footer">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="pause-resume-btn"
        >
          {isRunning ? "暂停" : "继续"}
        </button>
        <button className="end-session-btn" onClick={handleSkipToEnd}>
          结束会话
        </button>
      </div>
    </div>
  );
}

export default FocusSession;
