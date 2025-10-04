import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { boardService } from "../api/services/boardService";
import { getBoards, createBoard } from "../api";
import { useToast } from "../components/Toast";
import { BoardSkeleton } from "../components/SkeletonLoader";
import "./BoardListPage.css";

// 在文件顶部添加日期格式化函数
const formatDate = (dateString) => {
  if (!dateString) return "未知时间";

  const date = new Date(dateString);

  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return "未知时间";
  }

  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

function BoardListPage() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadBoards();

    // 监听来自 HomePage "Create" 按钮的全局事件
    window.addEventListener("create-new-board", handleCreateBoard);

    // 组件卸载时，移除监听器，防止内存泄漏
    return () => {
      window.removeEventListener("create-new-board", handleCreateBoard);
    };
  }, []);

  const loadBoards = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBoards();
      if (!response.ok) throw new Error("获取看板列表失败");
      const fetchedBoards = await response.json();

      setBoards(fetchedBoards);
    } catch (err) {
      setError(err.message);
      toast.error("加载看板失败", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    const boardTitle = prompt("请输入新看板的标题:");
    if (boardTitle && boardTitle.trim() !== "") {
      try {
        const response = await createBoard(boardTitle.trim());
        if (!response.ok) throw new Error("创建看板失败");
        toast.success("看板创建成功！", `看板"${boardTitle.trim()}"已创建`);
        loadBoards(); // Refresh the list
      } catch (err) {
        setError(err.message);
        toast.error("创建看板失败", err.message);
      }
    }
  };

  // --- 添加删除看板的处理函数 ---
  const handleDeleteBoard = async (boardId, boardTitle, event) => {
    event.preventDefault(); // 阻止点击事件冒泡到 Link 组件上
    event.stopPropagation();

    if (
      window.confirm(`您确定要删除看板 "${boardTitle}" 吗？此操作不可撤销。`)
    ) {
      try {
        const result = await boardService.deleteBoard(boardId);
        if (result.success) {
          toast.success(`看板 "${boardTitle}" 已删除`);
          loadBoards(); // 重新加载列表
        } else {
          throw new Error(result.message || "删除失败");
        }
      } catch (err) {
        toast.error("删除看板失败", err.message);
      }
    }
  };

  if (loading) return <BoardSkeleton />;
  if (error)
    return (
      <div className="error-container">
        <div className="error-content">
          <h2>⚠️ 出现错误</h2>
          <p>{error}</p>
          <button onClick={loadBoards} className="retry-button">
            重试
          </button>
        </div>
      </div>
    );

  return (
    <div className="board-list-page">
      <header className="board-list-header">
        <h1>我的看板</h1>
        <button onClick={handleCreateBoard} className="create-board-btn">
          + 创建新看板
        </button>
      </header>
      {boards.length === 0 ? (
        <div className="no-boards-container">
          <h2>欢迎！</h2>
          <p>你还没有创建任何看板，快来创建你的第一个吧！</p>
          <button onClick={handleCreateBoard}>创建新看板</button>
        </div>
      ) : (
        <div className="boards-grid">
          {boards.map((board) => (
            <Link
              key={board.id}
              to={`/boards/${board.id}`}
              className="board-card"
            >
              <div className="board-card-content">
                <h3>{board.title}</h3>
                <p>创建于: {formatDate(board.created_at)}</p>
              </div>
            </Link>
          ))}

          {/* 在看板列表末尾添加一个“创建新看板”的卡片 */}
          <div
            className="board-card create-new-board-card"
            onClick={handleCreateBoard}
            role="button"
            tabIndex={0}
          >
            <div className="board-card-content">
              <h3>+ 创建新看板</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BoardListPage;
