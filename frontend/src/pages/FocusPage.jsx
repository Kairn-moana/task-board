import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FocusSession from "../components/FocusSession";
import { getBoards, getBoardDetails } from "../api";
import { useToast } from "../components/Toast";

function FocusPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFocusTasks = async () => {
      try {
        // 获取所有看板和卡片数据
        const boardsResponse = await getBoards();
        if (!boardsResponse.ok) throw new Error("获取看板失败");
        const boards = await boardsResponse.json();

        let allTasks = [];

        // 遍历每个看板获取卡片
        for (const board of boards) {
          const boardResponse = await getBoardDetails(board.id);
          if (boardResponse.ok) {
            const boardData = await boardResponse.json();
            // 扁平化所有卡片
            const boardTasks = boardData.flatMap((list) => list.cards || []);
            allTasks = [...allTasks, ...boardTasks];
          }
        }

        // 筛选出近期到期的任务
        const today = new Date();
        const upcoming = allTasks.filter((task) => {
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          const diffTime = dueDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7; // 一周内到期的任务
        });

        setTasks(upcoming);
      } catch (err) {
        console.error("获取专注任务失败:", err);
        setError("无法加载专注任务，请稍后再试。");
        toast.error("加载失败", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFocusTasks();
  }, []);

  const handleEndSession = (focusedTask, skipped = false) => {
    // 专注结束后，可以导航回主页或显示一个完成摘要
    toast.info("专注时段结束！", "休息一下吧！");
    // 在实际应用中，这里可能会记录日志或更新任务状态

    // 延迟一点时间让用户看到提示，然后导航回主页
    setTimeout(() => {
      navigate("/"); // 跳转回主页
    }, 1500); // 1.5秒后跳转
  };

  if (loading) {
    return <div>正在加载专注任务...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (tasks.length === 0) {
    return <div>太棒了！近期没有需要专注的任务。</div>;
  }

  return <FocusSession tasks={tasks} onEndSession={handleEndSession} />;
}

export default FocusPage;
