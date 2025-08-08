import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import "./CardDetailsModal.css";
import { saveAttachment, deleteAttachment, getBoardTags, addTagToCard, removeTagFromCard } from "../api";
import { useKeyboardShortcuts, COMMON_SHORTCUTS } from "../hooks/useKeyboardShortcuts";
import { TagList, TagSelector } from "./Tag";

// Tiptap 的工具栏组件
const MenuBar = ({ editor }) => {
  if (!editor) return null;
  return (
    <div className="menu-bar">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "is-active" : ""}
      >
        Bold
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "is-active" : ""}
      >
        Italic
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
      >
        H2
      </button>
      {/* ...可以添加更多按钮... */}
    </div>
  );
};

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

function CardDetailsModal({
  card,
  isOpen,
  onClose,
  onSave,
  onAttachmentAdd,
  onAttachmentDelete,
  boardId,
  onTagsUpdate,
}) {
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState(0);
  const [status, setStatus] = useState("Todo");
  const [dueDate, setDueDate] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deletingAttachment, setDeletingAttachment] = useState(null);
  
  // 标签相关状态
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);

  // 添加Esc键关闭模态框支持
  useKeyboardShortcuts({
    closeModal: {
      ...COMMON_SHORTCUTS.ESCAPE,
      callback: () => {
        if (isOpen) {
          onClose();
        }
      },
      allowInInput: true
    }
  }, [isOpen, onClose]);

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // --- 核心检查点 ---
    // 在这里，card 应该是从 props 传入的最新值

    if (!card || !card.id) {
      setError("错误：无法获取当前卡片ID，无法上传附件。");
      return;
    }

    setUploading(true);
    setError(null);

    // --- 步骤 1: 上传到 Cloudinary ---
    let cloudinaryData = null;
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "task_board_uploads"); // 你的预设名

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/dru2l2q2b/auto/upload`; // 你的 Cloud Name

      const response = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        // 如果 Cloudinary 返回错误，尝试解析错误信息
        const errorData = await response.json();
        console.error("Cloudinary Error:", errorData);
        throw new Error(
          errorData.error.message || "Upload to Cloudinary failed"
        );
      }

      cloudinaryData = await response.json();

    } catch (uploadError) {
      console.error("Error during Cloudinary upload:", uploadError);
      setError(`文件上传到云端失败: ${uploadError.message}`);
      setUploading(false);
      return; // 失败则终止
    }

    // --- 步骤 2: 将元数据保存到你的数据库 ---
    try {
      const attachmentData = {
        card_id: card.id,
        file_name: cloudinaryData.original_filename || file.name,
        file_url: cloudinaryData.secure_url,
        file_type: cloudinaryData.resource_type || "file",
        file_size: cloudinaryData.bytes,
      };

      const saveResponse = await saveAttachment(attachmentData);

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(
          errorData.msg || `Failed to save attachment: ${saveResponse.status}`
        );
      }

      const newAttachment = await saveResponse.json();

      // 更新UI：将新附件添加到列表中
      onAttachmentAdd(newAttachment);
    } catch (saveError) {
      console.error("Error saving attachment to database:", saveError);
      setError(`文件已上传，但保存记录失败: ${saveError.message}`);
    } finally {
      setUploading(false); // 无论成功失败，都结束加载状态
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!confirm("确定要删除这个附件吗？")) {
      return;
    }

    setDeletingAttachment(attachmentId);
    setError(null);

    try {
      const response = await deleteAttachment(attachmentId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "删除失败");
      }

      // 从当前附件列表中移除已删除的附件
      setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));

      // 通知父组件更新状态
      if (onAttachmentDelete && card) {
        onAttachmentDelete(attachmentId, card.id);
      }

    } catch (deleteError) {
      console.error("删除附件失败:", deleteError);
      setError(`删除失败: ${deleteError.message}`);
    } finally {
      setDeletingAttachment(null);
    }
  };

  const editor = useEditor({
    extensions: [StarterKit, TextStyle, FontFamily],
    // 当内容发生变化时，更新我们组件内部的 state
    content: "", // 初始内容为空，我们通过 useEffect 来设置
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    // editable: true, // 确保编辑器是可编辑的
  });

  useEffect(() => {
    if (isOpen && card && editor) {
      // 设置编辑器的内容
      if (card.description) {
        editor.commands.setContent(card.description);
        setContent(card.description);
      } else {
        editor.commands.setContent("");
        setContent("");
      }

      setPriority(card.priority || 0);
      setStatus(card.status || "Todo");
      // 格式化日期以适应 <input type="date">
      setDueDate(
        card.due_date ? new Date(card.due_date).toISOString().split("T")[0] : ""
      );
      setAttachments(card.attachments || []);
      setSelectedTags(card.tags || []);
    }
  }, [card, editor, isOpen]);

  // 加载可用标签
  useEffect(() => {
    const loadAvailableTags = async () => {
      if (!boardId || !isOpen) return;
      
      setLoadingTags(true);
      try {
        const response = await getBoardTags(boardId);
        if (response.ok) {
          const tags = await response.json();
          setAvailableTags(tags);
        } else {
          console.error('加载标签失败');
        }
      } catch (error) {
        console.error('加载标签失败:', error);
      } finally {
        setLoadingTags(false);
      }
    };

    loadAvailableTags();
  }, [boardId, isOpen]);

  // 标签处理函数
  const handleTagSelect = async (tag) => {
    if (!card) return;
    
    try {
      const response = await addTagToCard(card.id, tag.id);
      if (response.ok) {
        setSelectedTags(prev => [...prev, tag]);
        onTagsUpdate && onTagsUpdate();
      } else {
        const errorData = await response.json();
        setError(`添加标签失败: ${errorData.msg || '未知错误'}`);
      }
    } catch (error) {
      console.error('添加标签失败:', error);
      setError('添加标签失败');
    }
  };

  const handleTagRemove = async (tag) => {
    if (!card) return;
    
    try {
      const response = await removeTagFromCard(card.id, tag.id);
      if (response.ok) {
        setSelectedTags(prev => prev.filter(t => t.id !== tag.id));
        onTagsUpdate && onTagsUpdate();
      } else {
        const errorData = await response.json();
        setError(`移除标签失败: ${errorData.msg || '未知错误'}`);
      }
    } catch (error) {
      console.error('移除标签失败:', error);
      setError('移除标签失败');
    }
  };

  if (!isOpen) {
    return null; // 如果模态框不是打开状态，什么都不渲染
  }

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    const updates = {
      description: content,
      priority: priority,
      status: status,
      due_date: dueDate || null, // 如果日期为空，发送 null 到后端
    };

    try {
      await onSave(card.id, updates);
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
        <div className="card-meta">
          <div className="meta-item">
            <label>状态</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Todo">待办</option>
              <option value="In Progress">进行中</option>
              <option value="Done">已完成</option>
            </select>
          </div>
          <div className="meta-item">
            <label>优先级</label>
            <select
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value))}
            >
              <option value="0">无</option>
              <option value="1">低</option>
              <option value="2">中</option>
              <option value="3">高</option>
            </select>
          </div>
          <div className="meta-item">
            <label>截止日期</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="meta-item tags-meta-item">
            <label>标签</label>
            {loadingTags ? (
              <div className="tags-loading">加载标签中...</div>
            ) : (
              <TagSelector
                availableTags={availableTags}
                selectedTags={selectedTags}
                onTagSelect={handleTagSelect}
                onTagDeselect={handleTagRemove}
                placeholder="选择或搜索标签..."
                className="card-tag-selector"
              />
            )}
          </div>
        </div>
        <div className="tiptap-editor-wrapper">
          {/* 这是 Tiptap 编辑器的工具栏 */}
          <MenuBar editor={editor} />
          {/* 这是 Tiptap 编辑器的内容区域 */}
          <EditorContent editor={editor} />
        </div>

        {/* --- 新增或修改：附件上传区域 --- */}
        <div className="attachments-section">
          <h3>附件</h3>
          {/* --- 新增：渲染附件列表 --- */}
          <div className="attachments-list">
            {attachments.length > 0 ? (
              attachments.map((att) => (
                <div key={att.id} className="attachment-item">
                  <div className="attachment-info">
                    {/* 链接到文件URL，在新窗口打开 */}
                    <a
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {att.file_name}
                    </a>
                    {/* (可选) 显示文件大小、上传时间等 */}
                    <span className="file-meta">
                      ({(att.file_size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  {/* 删除按钮 */}
                  <button
                    className="delete-attachment-btn"
                    onClick={() => handleDeleteAttachment(att.id)}
                    disabled={deletingAttachment === att.id}
                    title="删除附件"
                  >
                    {deletingAttachment === att.id ? "删除中..." : "×"}
                  </button>
                </div>
              ))
            ) : (
              <p>还没有附件。</p>
            )}
          </div>

          {/* 这是一个隐藏的文件输入框 */}
          <input
            type="file"
            id="file-upload-input"
            style={{ display: "none" }}
            onChange={handleFileUpload}
            disabled={uploading}
          />

          {/* 这是一个用户能看到的、漂亮的按钮 */}
          {/* 点击这个 label，实际上会触发上面那个隐藏的 input */}
          <label
            htmlFor="file-upload-input"
            className={`upload-btn ${uploading ? "disabled" : ""}`}
          >
            + 添加附件
          </label>

          {/* (可选) 显示上传状态 */}
          {uploading && <p>上传中...</p>}
          {error && <p className="error-message">{error}</p>}
        </div>

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
  );
}

export default CardDetailsModal;
