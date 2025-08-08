import { useState, useEffect } from "react";
import {
  getBoards,
  getBoardDetails,
  createBoard,
  createList,
  createCard,
  updateCardsOrder,
  updateCardDetails,
  deleteCardAPI,
  getBoardTags,
} from "../api"; // 假设你的 API 文件在这里
import { DndContext, closestCorners } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable"; // 导入 arrayMove
import Board from "../components/Board"; // 我们将要创建的 Board 组件
import CardDetailsModal from "../components/CardDetailsModal"; // 导入新组件
import { BoardSkeleton, LoadingSpinner } from "../components/SkeletonLoader";
import { useToast } from "../components/Toast";
import SearchModal from "../components/SearchModal";
import QuickSearchBox from "../components/QuickSearchBox";
import KeyboardShortcutsHelp from "../components/KeyboardShortcutsHelp";
import TagManager from "../components/TagManager";

import {
  useKeyboardShortcuts,
  COMMON_SHORTCUTS,
} from "../hooks/useKeyboardShortcuts";
import "../styles/BoardPage.css";

function BoardPage() {
  const [boards, setBoards] = useState([]); // --- 新增：存储看板列表 ---
  const [lists, setLists] = useState([]); // 用来存储列表和卡片数据
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentBoardId, setCurrentBoardId] = useState(null); // 新增 state 来存储当前看板ID
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  const [availableTags, setAvailableTags] = useState([]);
  const [focusedCardIndex, setFocusedCardIndex] = useState({
    listIndex: 0,
    cardIndex: 0,
  });

  // Toast hook
  const toast = useToast();

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

  useEffect(() => {
    // 检查是否有token，如果没有则创建一个临时token
    const token = localStorage.getItem("token");
    if (!token) {
      // 创建一个临时token用于开发测试
      localStorage.setItem("token", "dev-token-testuser");
    }
    loadInitialData();
  }, []);

  // --- 新增：创建看板的事件处理函数 ---
  const handleCreateBoard = async () => {
    const boardTitle = prompt("请输入新看板的标题:");
    if (boardTitle && boardTitle.trim() !== "") {
      try {
        const response = await createBoard(boardTitle.trim());
        if (!response.ok) throw new Error("创建看板失败");

        // --- 关键：创建成功后，重新加载初始数据 ---
        // 这会自动刷新整个页面，显示出新创建的看板
        setLoading(true); // 显示加载状态
        await loadInitialData();
        toast.success("看板创建成功！", `看板"${boardTitle.trim()}"已创建`);
      } catch (err) {
        setError(err.message);
        toast.error("创建看板失败", err.message);
      }
    }
  };

  // --- 抽取出加载数据的函数，方便复用 ---
  const loadInitialData = async () => {
    try {
      setError(null); // 重置错误
      const boardsResponse = await getBoards();
      if (!boardsResponse.ok) throw new Error("获取看板列表失败");
      const fetchedBoards = await boardsResponse.json();
      setBoards(fetchedBoards); // 更新看板列表状态

      if (fetchedBoards.length > 0) {
        const boardToLoadId = currentBoardId || fetchedBoards[0].id;
        setCurrentBoardId(boardToLoadId);

        const detailsResponse = await getBoardDetails(boardToLoadId);
        if (!detailsResponse.ok) throw new Error("获取看板详情失败");
        const boardDetails = await detailsResponse.json();
        setLists(boardDetails);

        // 加载标签
        try {
          const tagsResponse = await getBoardTags(boardToLoadId);
          if (tagsResponse.ok) {
            const tags = await tagsResponse.json();
            setAvailableTags(tags);
          }
        } catch (tagError) {
          console.error("加载标签失败:", tagError);
        }
      } else {
        setLists([]);
        setCurrentBoardId(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 新增：创建列表的事件处理函数 ---
  const handleCreateList = async () => {
    const listTitle = prompt("请输入新列表的标题 (例如：待办事项):");
    if (listTitle && listTitle.trim() !== "" && currentBoardId) {
      try {
        const response = await createList(currentBoardId, listTitle.trim());
        if (!response.ok) throw new Error("创建列表失败");

        // 同样，创建成功后，重新渲染当前看板的详情
        const detailsResponse = await getBoardDetails(currentBoardId);
        const boardDetails = await detailsResponse.json();
        setLists(boardDetails); // 只更新 lists 状态，触发重新渲染
        toast.success("列表创建成功！", `列表"${listTitle.trim()}"已创建`);
      } catch (err) {
        setError(err.message);
        toast.error("创建列表失败", err.message);
      }
    }
  };

  // --- 新增：创建卡片的事件处理函数 ---
  const handleCreateCard = async (listId) => {
    // 这个 listId 就是从 List.jsx 组件传上来的！
    const cardTitle = prompt("请输入新卡片的标题：");
    if (cardTitle && cardTitle.trim() !== "" && currentBoardId) {
      try {
        // 调用 API 需要 boardId, listId 和 title
        const response = await createCard(
          currentBoardId,
          listId,
          cardTitle.trim()
        );
        if (!response.ok) throw new Error("创建卡片失败");

        // 成功后，重新渲染整个看板以显示新卡片
        // 调用我们已经有的 loadInitialData 里的逻辑
        const detailsResponse = await getBoardDetails(currentBoardId);
        const boardDetails = await detailsResponse.json();
        setLists(boardDetails);
        toast.success("卡片创建成功！", `卡片"${cardTitle.trim()}"已创建`);
      } catch (err) {
        setError(err.message);
        toast.error("创建卡片失败", err.message);
      }
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

      const updatedCard = await response.json();

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

      // 不要立即关闭模态框，让用户看到保存成功的效果
      // 用户可以手动关闭模态框

      toast.success("保存成功！", "卡片信息已更新");
    } catch (error) {
      console.error("保存卡片时出错:", error);
      toast.error("保存失败", error.message || "请检查网络连接或稍后再试");
      // 重新抛出错误，让CardDetailsModal能够捕获
      throw error;
    }
  };
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

  const handleAttachmentAdded = (newAttachment) => {
    // newAttachment 是从子组件回传的、数据库里最新的附件对象
    // 它应该包含 card_id

    setLists((prevLists) => {
      return prevLists.map((list) => {
        return {
          ...list,
          cards: list.cards.map((card) => {
            // 找到对应的卡片
            if (card.id === newAttachment.card_id) {
              // 返回一个更新了 attachments 数组的新卡片对象
              return {
                ...card,
                attachments: [...(card.attachments || []), newAttachment],
              };
            }
            return card;
          }),
        };
      });
    });
  };

  const handleAttachmentDeleted = (deletedAttachmentId, cardId) => {
    // 从指定卡片中删除附件
    setLists((prevLists) => {
      return prevLists.map((list) => {
        return {
          ...list,
          cards: list.cards.map((card) => {
            // 找到对应的卡片
            if (card.id === cardId) {
              // 返回一个移除了指定附件的新卡片对象
              return {
                ...card,
                attachments: (card.attachments || []).filter(
                  (att) => att.id !== deletedAttachmentId
                ),
              };
            }
            return card;
          }),
        };
      });
    });

    // 同时更新selectedCard以保持模态框数据同步
    if (selectedCard && selectedCard.id === cardId) {
      setSelectedCard((prev) => ({
        ...prev,
        attachments: (prev.attachments || []).filter(
          (att) => att.id !== deletedAttachmentId
        ),
      }));
    }
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
    if (!currentBoardId) return;

    try {
      const response = await getBoardTags(currentBoardId);
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

  if (loading) return <BoardSkeleton />;
  if (error)
    return (
      <div className="error-container">
        <div className="error-content">
          <h2>⚠️ 出现错误</h2>
          <p>{error}</p>
          <button onClick={loadInitialData} className="retry-button">
            重试
          </button>
        </div>
      </div>
    );

  // --- 修改：当没有看板时，绑定 handleCreateBoard 事件 ---
  if (boards.length === 0) {
    return (
      <div className="welcome-container">
        <h2>欢迎！</h2>
        <p>你还没有创建任何看板，快来创建你的第一个吧！</p>
        <button onClick={handleCreateBoard}>创建新看板</button>
      </div>
    );
  }

  return (
    <div className="board-page">
      <DndContext
        onDragEnd={handleDragEnd}
        collisionDetection={closestCorners} // 一种碰撞检测算法
      >
        {/* 后面可以把这里做成一个下拉菜单来切换看板 */}
        <header className="board-header">
          <h1>
            当前看板: {boards.find((b) => b.id === currentBoardId)?.title}
          </h1>
          <div>
            {/* 用一个 div 把按钮包起来，方便布局 */}
            {/* 这个按钮用于在当前看板下创建列表 */}
            <button onClick={handleCreateList}>+ 添加列表</button>

            {/* 标签管理按钮 */}
            <button onClick={() => setIsTagManagerOpen(true)}>
              🏷️ 管理标签
            </button>

            {/* 这个按钮用于创建全新的看板 */}
            <button onClick={handleCreateBoard}>+ 创建新看板</button>
          </div>
        </header>
        <Board
          lists={lists}
          onAddCard={handleCreateCard}
          onDeleteCard={handleDeleteCard}
          onOpenCard={handleOpenCardModal}
        />
      </DndContext>

      {console.log(
        "渲染检查 - isModalOpen:",
        isModalOpen,
        "selectedCard:",
        selectedCard
      )}

      {/* --- 新增：条件渲染模态框 --- */}
      <CardDetailsModal
        isOpen={isModalOpen}
        card={selectedCard}
        onClose={handleCloseModal}
        onSave={handleSaveCard}
        onAttachmentAdd={handleAttachmentAdded}
        onAttachmentDelete={handleAttachmentDeleted}
        boardId={currentBoardId}
        onTagsUpdate={handleTagsUpdated}
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
        boardId={currentBoardId}
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        onTagsUpdated={handleTagsUpdated}
      />

      {/* 快捷键帮助 */}
      <KeyboardShortcutsHelp />
    </div>
  );
}

export default BoardPage;
