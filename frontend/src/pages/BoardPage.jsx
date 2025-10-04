import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { boardService, cardService, tagService } from "../api";
import {
  getBoardDetails,
  createList,
  createCard,
  updateCardsOrder,
  updateCardDetails,
  deleteCardAPI,
  getBoardTags,
  getCardDetails,
} from "../api"; // 假设你的 API 文件在这里
import { DndContext, closestCorners } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable"; // 导入 arrayMove
import Board from "../components/Board"; // 我们将要创建的 Board 组件
import CardDetailsModal from "../components/CardDetailsModal"; // 导入新组件
import { BoardSkeleton } from "../components/SkeletonLoader";
import { useToast } from "../components/Toast";
import SearchModal from "../components/SearchModal";
import QuickSearchBox from "../components/QuickSearchBox";
import KeyboardShortcutsHelp from "../components/KeyboardShortcutsHelp";
import TagManager from "../components/TagManager";
import RecommendationModal from "../components/RecommendationModal";

import {
  useKeyboardShortcuts,
  COMMON_SHORTCUTS,
} from "../hooks/useKeyboardShortcuts";
import "../styles/BoardPage.css";

// --- 新增：日期辅助函数 ---
const isDateInThisWeek = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  // 修正：确保 getDay() 的行为符合预期 (周日为0)
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // 周一作为一周的开始
  const firstDayOfWeek = new Date(today.setDate(diff));
  firstDayOfWeek.setHours(0, 0, 0, 0);

  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
  lastDayOfWeek.setHours(23, 59, 59, 999);

  return date >= firstDayOfWeek && date <= lastDayOfWeek;
};

const isToday = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [filters, setFilters] = useState({
    emotion: "",
    priority: "",
    tagId: "",
  });
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const activeFiltersCount = useMemo(() => {
    const { emotion, priority, tagId } = filters;
    return [emotion, priority, tagId].filter(Boolean).length;
  }, [filters]);

  const [availableTags, setAvailableTags] = useState([]);
  const [focusedCardIndex, setFocusedCardIndex] = useState({
    listIndex: 0,
    cardIndex: 0,
  });
  const toast = useToast();

  // 添加 refs 用于追踪菜单容器
  const filterMenuRef = useRef(null);
  const editMenuRef = useRef(null);

  // 添加点击外部关闭的事件处理函数
  useEffect(() => {
    function handleClickOutside(event) {
      // 检查筛选器菜单
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target)
      ) {
        setIsFilterMenuOpen(false);
      }
      // 检查编辑菜单
      if (editMenuRef.current && !editMenuRef.current.contains(event.target)) {
        setIsEditMenuOpen(false);
      }
    }

    // 添加全局点击事件监听
    document.addEventListener("mousedown", handleClickOutside);

    // 清理函数
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadInitialData = async (id) => {
    try {
      setLoading(true);
      setError(null);

      const detailsResponse = await getBoardDetails(id);
      if (!detailsResponse.ok) throw new Error(`请求看板数据失败 (ID: ${id})`);
      const boardDetails = await detailsResponse.json();

      if (
        boardDetails &&
        typeof boardDetails === "object" &&
        !Array.isArray(boardDetails)
      ) {
        // 假设API返回一个包含列表的对象: { id, title, lists: [...] }
        setLists(boardDetails.lists || []);
        setBoard(boardDetails);
      } else if (Array.isArray(boardDetails)) {
        // 备用方案: 如果API只返回列表数组
        setLists(boardDetails);
        setBoard({ id: id, title: "看板" }); // 标题需要单独处理
      } else {
        throw new Error("返回的看板数据格式不正确");
      }

      const tagsResponse = await getBoardTags(id);
      if (tagsResponse.ok) {
        const tags = await tagsResponse.json();
        setAvailableTags(tags);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!boardId || boardId === "undefined") {
      console.log("无效的 boardId，重定向到看板列表");
      navigate("/boards", { replace: true });
    }
  }, [boardId, navigate]);

  // 这个 useEffect 来加载数据
  useEffect(() => {
    if (boardId && boardId !== "undefined") {
      loadInitialData(boardId);
    }
  }, [boardId]);

  // 处理修改看板名称
  const handleRenameBoard = async () => {
    setIsEditMenuOpen(false); // 关闭菜单
    const oldTitle = board.title;
    const newTitle = prompt("请输入新的看板名称：", oldTitle);

    if (newTitle && newTitle.trim() !== "" && newTitle.trim() !== oldTitle) {
      try {
        const result = await boardService.updateBoard(boardId, {
          title: newTitle.trim(),
        });
        if (result.success) {
          setBoard((prev) => ({ ...prev, title: result.data.title }));
          toast.success("看板名称已更新！");
        } else {
          throw new Error(result.message);
        }
      } catch (err) {
        toast.error("更新失败", err.message);
      }
    }
  };

  // 处理删除看板
  const handleDeleteBoard = async () => {
    setIsEditMenuOpen(false); // 关闭菜单
    if (
      window.confirm(`确定要删除看板 "${board.title}" 吗？此操作将无法撤销。`)
    ) {
      try {
        const result = await boardService.deleteBoard(boardId);
        if (result.success) {
          toast.success("看板已删除");
          navigate("/boards"); // 返回列表页
        } else {
          throw new Error(result.message);
        }
      } catch (err) {
        toast.error("删除失败", err.message);
      }
    }
  };

  // 新增：处理归档看板
  const handleArchiveBoard = async () => {
    setIsEditMenuOpen(false);
    if (window.confirm(`确定要归档看板 "${board.title}" 吗？`)) {
      try {
        const result = await boardService.updateBoard(boardId, {
          is_archived: true,
        });
        if (result.success) {
          toast.success("看板已归档");
          navigate("/boards");
        } else {
          throw new Error(result.message);
        }
      } catch (err) {
        toast.error("归档失败", err.message);
      }
    }
  };

  // 新增：处理更换背景图
  const handleChangeBackground = async () => {
    setIsEditMenuOpen(false);
    const newUrl = prompt(
      "请输入新的背景图片URL：",
      board.background_image_url || ""
    );

    // newUrl 可以是空字符串，表示移除背景
    if (newUrl !== null) {
      try {
        const result = await boardService.updateBoard(boardId, {
          background_image_url: newUrl,
        });
        if (result.success) {
          setBoard((prev) => ({
            ...prev,
            background_image_url: result.data.background_image_url,
          }));
          toast.success("背景已更新！");
        } else {
          throw new Error(result.message);
        }
      } catch (err) {
        toast.error("更新背景失败", err.message);
      }
    }
  };

  // 如果 boardId 无效，显示加载状态直到重定向完成
  if (!boardId || boardId === "undefined") {
    return <div>正在重定向到看板列表...</div>;
  }

  // --- 新增：创建列表的事件处理函数 ---
  const handleCreateList = async () => {
    const listTitle = prompt("请输入新列表的标题 (例如：待办事项):");
    if (listTitle && listTitle.trim() !== "" && boardId) {
      try {
        await createList(boardId, listTitle.trim());
        await loadInitialData(boardId); // 重新加载数据
        toast.success("列表创建成功！");
      } catch (err) {
        toast.error("创建列表失败", err.message);
      }
    }
  };

  // --- 新增：创建卡片的事件处理函数 ---
  const handleCreateCard = async (listId) => {
    const cardTitle = prompt("请输入新卡片的标题：");
    if (cardTitle && cardTitle.trim() !== "" && boardId) {
      try {
        await createCard(boardId, listId, cardTitle.trim());
        await loadInitialData(boardId); // 重新加载数据
        toast.success("卡片创建成功！");
      } catch (err) {
        toast.error("创建卡片失败", err.message);
      }
    }
  };

  // 创建处理删除的函数
  const handleDeleteCard = async (cardId) => {
    if (window.confirm("确定要删除这张卡片吗？")) {
      try {
        const response = await deleteCardAPI(cardId); // 假设你 api/index.js 里有这个函数
        if (!response.ok) throw new Error("删除失败");

        // 关键：在前端直接更新状态，而不是重新请求整个看板
        setLists((prevLists) =>
          prevLists.map((list) => ({
            ...list,
            cards: list.cards.filter((card) => card.id !== cardId),
          }))
        );
      } catch (error) {
        console.error(error);
      }
    }
  };

  // --- 新增：管理模态框状态 ---

  const handleOpenCardModal = (card) => {
    setSelectedCard(card);
    setIsModalOpen(true);

    console.log("状态已设置 (但可能尚未渲染), isModalOpen 应该是 true");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCard(null);
  };

  const handleSaveCard = async (cardId, updates) => {
    try {
      // 直接将从 CardDetailsModal 接收到的 updates 对象传递给 API 函数
      const response = await updateCardDetails(cardId, updates);

      if (!response.ok) throw new Error("保存到数据库失败");

      // 重新从服务器获取最新的卡片信息（包括子任务）
      const cardDetailsResponse = await getCardDetails(cardId);
      if (!cardDetailsResponse.ok) throw new Error("获取最新卡片信息失败");

      const updatedCard = await cardDetailsResponse.json();
      console.log("📋 从服务器重新获取的卡片数据:", updatedCard); // 添加调试日志
      console.log("📋 重新获取的子任务数据:", updatedCard.subtasks); // 添加调试日志

      // 更新前端 state 来立即反映变化
      setLists((prevLists) => {
        return prevLists.map((list) => ({
          ...list,
          cards: list.cards.map((card) => {
            return card.id === cardId ? updatedCard : card;
          }),
        }));
      });

      // 更新 selectedCard 以确保模态框数据同步
      setSelectedCard(updatedCard);

      toast.success("保存成功！", "卡片信息已更新");
    } catch (error) {
      console.error("保存卡片时出错:", error);
      toast.error("保存失败", error.message || "请检查网络连接或稍后再试");
      // 重新抛出错误，让CardDetailsModal能够捕获
      throw error;
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }
    // 乐观更新 UI
    const newLists = setLists((prevLists) => {
      // ... (这部分查找逻辑可以保持不变，也可以简化，我们用现有逻辑)
      let activeListIndex = -1;
      let activeCardIndex = -1;
      let overListIndex = -1;
      let overCardIndex = -1;
      let overIsList = false;

      prevLists.forEach((list, listIndex) => {
        const cardIdx = list.cards.findIndex((card) => card.id === active.id);
        if (cardIdx !== -1) {
          activeListIndex = listIndex;
          activeCardIndex = cardIdx;
        }
        const overCardIdx = list.cards.findIndex((card) => card.id === over.id);
        if (overCardIdx !== -1) {
          overListIndex = listIndex;
          overCardIndex = overCardIdx;
        }
        if (list.id === over.id) {
          overIsList = true;
          overListIndex = listIndex;
        }
      });

      if (activeListIndex === -1) {
        console.error("Could not find active card");
        return prevLists; // 如果找不到，返回原状态
      }

      const updatedLists = JSON.parse(JSON.stringify(prevLists));

      if (activeListIndex === overListIndex && !overIsList) {
        updatedLists[activeListIndex].cards = arrayMove(
          updatedLists[activeListIndex].cards,
          activeCardIndex,
          overCardIndex
        );
      } else if (activeListIndex !== overListIndex) {
        const [movedCard] = updatedLists[activeListIndex].cards.splice(
          activeCardIndex,
          1
        );
        if (overIsList) {
          updatedLists[overListIndex].cards.push(movedCard);
        } else {
          updatedLists[overListIndex].cards.splice(overCardIndex, 0, movedCard);
        }
      }

      return updatedLists;
    });

    // 因为 setLists 是异步的，我们不能立即使用 `lists` state
    // 所以，我们需要重新计算一次来获取更新后的数据用于API调用
    // (这是一个小小的冗余，但保证了逻辑的正确性)
    // 我们可以通过 useRef 或其他方式优化，但目前这是最清晰的
    setLists((currentLists) => {
      // 这里的 currentLists 是 React 保证的最新的 state
      const activeList = currentLists.find((list) =>
        list.cards.some((c) => c.id === active.id)
      );
      const overList = over
        ? currentLists.find(
            (list) =>
              list.cards.some((c) => c.id === over.id) || list.id === over.id
          )
        : null;

      let cardsToUpdate = [];
      if (activeList) {
        cardsToUpdate.push(
          ...activeList.cards.map((card, index) => ({
            id: card.id,
            order: index,
            list_id: activeList.id,
          }))
        );
      }
      if (overList && overList.id !== activeList?.id) {
        cardsToUpdate.push(
          ...overList.cards.map((card, index) => ({
            id: card.id,
            order: index,
            list_id: overList.id,
          }))
        );
      }

      const uniqueCardsToUpdate = Array.from(
        new Map(cardsToUpdate.map((item) => [item.id, item])).values()
      );

      if (uniqueCardsToUpdate.length > 0) {
        updateCardsOrder(uniqueCardsToUpdate)
          .then((response) => {
            if (!response.ok) console.error("后台同步顺序失败！");
            else console.log("后台顺序同步成功！");
          })
          .catch((err) => console.error("调用更新 API 时出错:", err));
      }

      return currentLists; // 必须返回 state
    });
  };

  // ---根据专注模式和筛选条件过滤列表 ---
  const filteredLists = useMemo(() => {
    let newLists = lists;

    // 多维度筛选逻辑
    const { emotion, priority, tagId } = filters;
    if (!emotion && !priority && !tagId) {
      return newLists; // 如果没有筛选条件，直接返回
    }

    return newLists.map((list) => ({
      ...list,
      cards: list.cards.filter((card) => {
        const emotionMatch = emotion ? card.emotion === emotion : true;
        const priorityMatch = priority
          ? card.priority === parseInt(priority)
          : true;
        const tagMatch = tagId
          ? card.tags && card.tags.some((tag) => tag.id === parseInt(tagId))
          : true;
        return emotionMatch && priorityMatch && tagMatch;
      }),
    }));
  }, [lists, filters]);

  // 获取当前焦点卡片
  const getCurrentFocusedCard = () => {
    if (lists.length === 0) return null;
    const { listIndex, cardIndex } = focusedCardIndex;
    const list = lists[listIndex];
    if (!list || !list.cards || list.cards.length === 0) return null;
    return list.cards[cardIndex] || null;
  };

  // 设置焦点到指定卡片
  const setFocusToCard = (listIndex, cardIndex) => {
    if (lists.length === 0) return;

    const targetList = lists[listIndex];
    if (!targetList || !targetList.cards) return;

    const maxCardIndex = Math.max(0, targetList.cards.length - 1);
    const validCardIndex = Math.min(cardIndex, maxCardIndex);

    setFocusedCardIndex({ listIndex, cardIndex: validCardIndex });
  };

  // 快捷创建新卡片
  const handleQuickCreateCard = () => {
    if (lists.length === 0) {
      toast.warning("请先创建一个列表", "需要先有列表才能创建卡片");
      return;
    }

    // 默认在第一个列表中创建卡片
    const firstListId = lists[0].id;
    handleCreateCard(firstListId);
  };

  // 键盘快捷键配置
  useKeyboardShortcuts(
    {
      // Ctrl+K 打开搜索
      openSearch: {
        ...COMMON_SHORTCUTS.SEARCH,
        callback: () => {
          setIsSearchOpen(true);
        },
      },
      // N 键创建新卡片
      createCard: {
        ...COMMON_SHORTCUTS.CREATE_CARD,
        callback: () => {
          handleQuickCreateCard();
        },
      },
      // Esc 关闭模态框
      closeModal: {
        ...COMMON_SHORTCUTS.ESCAPE,
        callback: () => {
          if (isModalOpen) {
            handleCloseModal();
          } else if (isSearchOpen) {
            setIsSearchOpen(false);
          } else if (isQuickSearchOpen) {
            setIsQuickSearchOpen(false);
          } else if (isTagManagerOpen) {
            setIsTagManagerOpen(false);
          }
        },
      },
      // 方向键导航
      navigateUp: {
        ...COMMON_SHORTCUTS.ARROW_UP,
        callback: () => {
          if (
            isModalOpen ||
            isSearchOpen ||
            isQuickSearchOpen ||
            isTagManagerOpen
          )
            return;

          const { listIndex, cardIndex } = focusedCardIndex;
          if (cardIndex > 0) {
            setFocusToCard(listIndex, cardIndex - 1);
          } else if (listIndex > 0) {
            // 跳到上一个列表的最后一张卡片
            const prevList = lists[listIndex - 1];
            if (prevList && prevList.cards.length > 0) {
              setFocusToCard(listIndex - 1, prevList.cards.length - 1);
            }
          }
        },
      },
      navigateDown: {
        ...COMMON_SHORTCUTS.ARROW_DOWN,
        callback: () => {
          if (
            isModalOpen ||
            isSearchOpen ||
            isQuickSearchOpen ||
            isTagManagerOpen
          )
            return;

          const { listIndex, cardIndex } = focusedCardIndex;
          const currentList = lists[listIndex];

          if (currentList && cardIndex < currentList.cards.length - 1) {
            setFocusToCard(listIndex, cardIndex + 1);
          } else if (listIndex < lists.length - 1) {
            // 跳到下一个列表的第一张卡片
            setFocusToCard(listIndex + 1, 0);
          }
        },
      },
      navigateLeft: {
        ...COMMON_SHORTCUTS.ARROW_LEFT,
        callback: () => {
          if (
            isModalOpen ||
            isSearchOpen ||
            isQuickSearchOpen ||
            isTagManagerOpen
          )
            return;

          const { listIndex, cardIndex } = focusedCardIndex;
          if (listIndex > 0) {
            setFocusToCard(listIndex - 1, cardIndex);
          }
        },
      },
      navigateRight: {
        ...COMMON_SHORTCUTS.ARROW_RIGHT,
        callback: () => {
          if (
            isModalOpen ||
            isSearchOpen ||
            isQuickSearchOpen ||
            isTagManagerOpen
          )
            return;

          const { listIndex, cardIndex } = focusedCardIndex;
          if (listIndex < lists.length - 1) {
            setFocusToCard(listIndex + 1, cardIndex);
          }
        },
      },
      // Enter 打开当前焦点卡片
      openCard: {
        ...COMMON_SHORTCUTS.ENTER,
        callback: () => {
          if (
            isModalOpen ||
            isSearchOpen ||
            isQuickSearchOpen ||
            isTagManagerOpen
          )
            return;

          const focusedCard = getCurrentFocusedCard();
          if (focusedCard) {
            handleOpenModal(focusedCard);
          }
        },
      },
    },
    [
      lists,
      focusedCardIndex,
      isModalOpen,
      isSearchOpen,
      isQuickSearchOpen,
      isTagManagerOpen,
    ]
  );

  // 需要token检查
  useEffect(() => {
    // 检查是否有token，如果没有则创建一个临时token
    const token = localStorage.getItem("token");
    if (!token) {
      // 创建一个临时token用于开发测试
      localStorage.setItem("token", "dev-token-testuser");
    }
  }, []);

  // 辅助函数，用于查找卡片所在的列表ID
  const findContainer = (id) => {
    for (const list of lists) {
      if (list.cards.some((card) => card.id === id)) {
        return list.id;
      }
    }
    // 如果 over 的是列表本身而不是卡片
    if (lists.some((list) => list.id === id)) {
      return id;
    }
    return null;
  };

  // 处理搜索选择卡片
  const handleSearchCardSelect = (card) => {
    handleOpenModal(card);
  };

  // 处理快速搜索选择卡片
  const handleQuickSearchCardSelect = (card) => {
    handleOpenModal(card);
  };

  // 从快速搜索打开完整搜索
  const handleOpenFullSearchFromQuick = (initialQuery = "") => {
    setIsQuickSearchOpen(false);
    setIsSearchOpen(true);
    // 这里可以传递初始查询，但SearchModal需要支持这个功能
  };

  // 加载看板标签
  const loadBoardTags = async () => {
    if (!boardId) return;

    try {
      const response = await getBoardTags(boardId);
      if (response.ok) {
        const tags = await response.json();
        setAvailableTags(tags);
      } else {
        console.error("加载标签失败");
      }
    } catch (error) {
      console.error("加载标签失败:", error);
    }
  };

  // 标签更新后的回调
  const handleTagsUpdated = () => {
    loadBoardTags();
    loadInitialData(); // 重新加载卡片数据以获取最新标签
  };

  // --- 处理筛选变化的函数 ---
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  // --- 清除所有筛选 ---
  const clearFilters = () => {
    setFilters({
      emotion: "",
      priority: "",
      tagId: "",
    });
  };

  if (loading) return <BoardSkeleton />;
  if (error)
    return (
      <div className="error-container">
        <div className="error-content">
          <h2>⚠️ 出现错误</h2>
          <p>{error}</p>
          <button
            onClick={() => loadInitialData(boardId)}
            className="retry-button"
          >
            重试
          </button>
        </div>
      </div>
    );

  // 如果看板不存在或加载失败
  if (!board) {
    return (
      <div className="welcome-container">
        <h2>看板未找到</h2>
        <p>无法加载此看板的数据，它可能已被删除或链接无效。</p>
        <Link to="/boards" className="retry-button">
          返回看板列表
        </Link>
      </div>
    );
  }

  return (
    <div className="board-page">
      <header className="board-page-header">
        <div className="header-left">
          <Link to="/boards" className="back-to-boards-btn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
              />
            </svg>
            <span>返回</span>
          </Link>
          <div className="board-title-container">
            <span className="board-icon">🧠</span>
            <h1 className="board-title">{board.title}</h1>
          </div>
        </div>
        <div className="header-right">
          {/* 其他按钮可以放在这里, 比如 "编辑" */}
          <div>
            <button onClick={handleCreateList}>+ 添加列表</button>
            <button onClick={() => setIsTagManagerOpen(true)}>
              🏷️ 管理标签
            </button>
          </div>
          <div>
            {/* --- 任务推荐按钮 --- */}
            <button
              onClick={() => setIsRecommendationOpen(true)}
              className="recommend-btn"
              title="任务推荐"
            >
              💡
            </button>
          </div>

          {/* --- 筛选栏 --- */}
          <div className="filter-menu-container" ref={filterMenuRef}>
            <button
              className={`board-header-btn ${
                activeFiltersCount ? "has-active" : ""
              }`}
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              title="筛选"
            >
              筛选{activeFiltersCount ? ` · ${activeFiltersCount}` : ""}
            </button>
            {isFilterMenuOpen && (
              <div className="filter-menu">
                <div className="filter-group">
                  <select
                    value={filters.emotion}
                    onChange={(e) =>
                      handleFilterChange("emotion", e.target.value)
                    }
                    className="filter-select"
                  >
                    <option value="">按情绪筛选...</option>
                    <option value="冷静">🧊 冷静</option>
                    <option value="焦虑">😰 焦虑</option>
                    <option value="紧张">😫 紧张</option>
                    <option value="愉快">☺️ 愉快</option>
                  </select>

                  <select
                    value={filters.priority}
                    onChange={(e) =>
                      handleFilterChange("priority", e.target.value)
                    }
                    className="filter-select"
                  >
                    <option value="">按优先级筛选...</option>
                    <option value="3">高</option>
                    <option value="2">中</option>
                    <option value="1">低</option>
                    <option value="0">无</option>
                  </select>

                  <select
                    value={filters.tagId}
                    onChange={(e) =>
                      handleFilterChange("tagId", e.target.value)
                    }
                    className="filter-select"
                  >
                    <option value="">按标签筛选...</option>
                    {availableTags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-actions">
                  <button onClick={clearFilters} className="clear-filters-btn">
                    清除
                  </button>
                  <button
                    className="board-header-btn primary-button"
                    onClick={() => setIsFilterMenuOpen(false)}
                  >
                    完成
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="edit-board-menu-container" ref={editMenuRef}>
            <button
              className="board-header-btn"
              onClick={() => setIsEditMenuOpen(!isEditMenuOpen)}
            >
              编辑
            </button>
            {isEditMenuOpen && (
              <div className="edit-board-menu">
                <button onClick={handleRenameBoard}>修改名称</button>
                <button onClick={handleChangeBackground}>更换背景</button>
                <button onClick={handleArchiveBoard}>归档看板</button>
                <hr />
                <button onClick={handleDeleteBoard} className="delete">
                  删除看板
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <Board
          lists={filteredLists}
          onAddCard={handleCreateCard}
          onDeleteCard={handleDeleteCard}
          onOpenCard={handleOpenCardModal}
        />
      </DndContext>

      {/* --- 条件渲染模态框 --- */}
      <CardDetailsModal
        isOpen={isModalOpen}
        card={selectedCard}
        onClose={handleCloseModal}
        onSave={handleSaveCard}
        boardId={boardId}
        onTagsUpdate={() => loadInitialData(boardId)}
      />

      {/* 搜索模态框 */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        lists={lists}
        onCardSelect={handleSearchCardSelect}
        availableTags={availableTags}
      />

      {/* 快速搜索框 */}
      <QuickSearchBox
        lists={lists}
        onCardSelect={handleQuickSearchCardSelect}
        onOpenFullSearch={handleOpenFullSearchFromQuick}
      />

      {/* 标签管理器 */}
      <TagManager
        boardId={boardId}
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        onTagsUpdated={handleTagsUpdated}
      />

      {/* --- 渲染推荐模态框 --- */}
      <RecommendationModal
        isOpen={isRecommendationOpen}
        onClose={() => setIsRecommendationOpen(false)}
      />

      {/* 快捷键帮助 */}
      <KeyboardShortcutsHelp />
    </div>
  );
}

export default BoardPage;
