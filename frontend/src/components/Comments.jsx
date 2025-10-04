import React, { useState, useEffect, useRef } from 'react';
import { getCardComments, addComment, updateComment, deleteComment, searchUsers } from '../api';
import { useToast } from './Toast';
import './Comments.css';

const Comments = ({ cardId, onCommentsUpdate }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  
  // @提及功能相关状态
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionUsers, setMentionUsers] = useState([]);
  const [mentionPosition, setMentionPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  
  const textareaRef = useRef(null);
  const mentionRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    loadComments();
  }, [cardId]);

  useEffect(() => {
    if (showMentions && mentionQuery) {
      searchMentionUsers(mentionQuery);
    }
  }, [mentionQuery]);

  const loadComments = async () => {
    if (!cardId) return;
    
    setLoading(true);
    try {
      const response = await getCardComments(cardId);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
        if (onCommentsUpdate) {
          onCommentsUpdate(data.comments?.length || 0);
        }
      } else {
        toast.error('加载评论失败');
      }
    } catch (error) {
      console.error('加载评论失败:', error);
      toast.error('加载评论失败');
    } finally {
      setLoading(false);
    }
  };

  const searchMentionUsers = async (query) => {
    try {
      const response = await searchUsers(query);
      if (response.ok) {
        const data = await response.json();
        setMentionUsers(data.users || []);
        setSelectedMentionIndex(0);
      }
    } catch (error) {
      console.error('搜索用户失败:', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await addComment(cardId, newComment.trim());
      if (response.ok) {
        setNewComment('');
        await loadComments();
        toast.success('评论添加成功');
      } else {
        toast.error('添加评论失败');
      }
    } catch (error) {
      console.error('添加评论失败:', error);
      toast.error('添加评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId) => {
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await addComment(cardId, replyContent.trim(), parentId);
      if (response.ok) {
        setReplyContent('');
        setReplyingTo(null);
        await loadComments();
        toast.success('回复添加成功');
      } else {
        toast.error('添加回复失败');
      }
    } catch (error) {
      console.error('添加回复失败:', error);
      toast.error('添加回复失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      const response = await updateComment(commentId, editContent.trim());
      if (response.ok) {
        setEditingComment(null);
        setEditContent('');
        await loadComments();
        toast.success('评论更新成功');
      } else {
        toast.error('更新评论失败');
      }
    } catch (error) {
      console.error('更新评论失败:', error);
      toast.error('更新评论失败');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('确定要删除这条评论吗？')) return;

    try {
      const response = await deleteComment(commentId);
      if (response.ok) {
        await loadComments();
        toast.success('评论删除成功');
      } else {
        toast.error('删除评论失败');
      }
    } catch (error) {
      console.error('删除评论失败:', error);
      toast.error('删除评论失败');
    }
  };

  const handleTextareaChange = (e, setValue) => {
    const value = e.target.value;
    setValue(value);

    // 检测@提及
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      setShowMentions(true);
      setMentionQuery(atMatch[1]);
      setMentionPosition(cursorPos);
    } else {
      setShowMentions(false);
      setMentionQuery('');
      setMentionUsers([]);
    }
  };

  const handleMentionSelect = (user, targetTextarea, setValue) => {
    const textarea = targetTextarea || textareaRef.current;
    if (!textarea) return;

    const value = textarea.value;
    const beforeMention = value.substring(0, mentionPosition - mentionQuery.length - 1);
    const afterMention = value.substring(mentionPosition);
    const newValue = `${beforeMention}@${user.username} ${afterMention}`;
    
    setValue(newValue);
    setShowMentions(false);
    setMentionQuery('');
    setMentionUsers([]);
    
    // 重新聚焦并设置光标位置
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = beforeMention.length + user.username.length + 2;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleMentionKeyDown = (e, targetTextarea, setValue) => {
    if (!showMentions || mentionUsers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < mentionUsers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : mentionUsers.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (mentionUsers[selectedMentionIndex]) {
          handleMentionSelect(mentionUsers[selectedMentionIndex], targetTextarea, setValue);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowMentions(false);
        setMentionQuery('');
        setMentionUsers([]);
        break;
    }
  };

  const formatCommentContent = (content) => {
    // 将@提及转换为高亮显示
    return content.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes < 1 ? '刚刚' : `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  const CommentItem = ({ comment, isReply = false }) => (
    <div className={`comment-item ${isReply ? 'comment-reply' : ''}`}>
      <div className="comment-header">
        <div className="comment-author">
          <span className="username">@{comment.username}</span>
          <span className="timestamp">{formatTimestamp(comment.created_at)}</span>
          {comment.updated_at !== comment.created_at && (
            <span className="edited-indicator">(已编辑)</span>
          )}
        </div>
        <div className="comment-actions">
          {!isReply && (
            <button 
              className="reply-btn"
              onClick={() => setReplyingTo(comment.id)}
              title="回复"
            >
              回复
            </button>
          )}
          <button 
            className="edit-btn"
            onClick={() => {
              setEditingComment(comment.id);
              setEditContent(comment.content);
            }}
            title="编辑"
          >
            编辑
          </button>
          <button 
            className="delete-btn"
            onClick={() => handleDeleteComment(comment.id)}
            title="删除"
          >
            删除
          </button>
        </div>
      </div>
      
      {editingComment === comment.id ? (
        <div className="comment-edit-form">
          <textarea
            value={editContent}
            onChange={(e) => handleTextareaChange(e, setEditContent)}
            onKeyDown={(e) => handleMentionKeyDown(e, e.target, setEditContent)}
            className="comment-edit-textarea"
            placeholder="编辑评论内容..."
          />
          <div className="comment-edit-actions">
            <button 
              onClick={() => handleEditSubmit(comment.id)}
              className="save-btn"
            >
              保存
            </button>
            <button 
              onClick={() => {
                setEditingComment(null);
                setEditContent('');
              }}
              className="cancel-btn"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="comment-content"
          dangerouslySetInnerHTML={{ __html: formatCommentContent(comment.content) }}
        />
      )}

      {/* 回复表单 */}
      {replyingTo === comment.id && (
        <div className="reply-form">
          <textarea
            value={replyContent}
            onChange={(e) => handleTextareaChange(e, setReplyContent)}
            onKeyDown={(e) => handleMentionKeyDown(e, e.target, setReplyContent)}
            placeholder={`回复 @${comment.username}...`}
            className="reply-textarea"
          />
          <div className="reply-actions">
            <button 
              onClick={() => handleReplySubmit(comment.id)}
              disabled={submitting || !replyContent.trim()}
              className="submit-reply-btn"
            >
              {submitting ? '发送中...' : '发送'}
            </button>
            <button 
              onClick={() => {
                setReplyingTo(null);
                setReplyContent('');
              }}
              className="cancel-reply-btn"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 回复列表 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="replies-container">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="comments-section">
      <div className="comments-header">
        <h3>评论 ({comments.length})</h3>
      </div>

      {/* 添加评论表单 */}
      <form onSubmit={handleCommentSubmit} className="add-comment-form">
        <div className="comment-input-container">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={(e) => handleTextareaChange(e, setNewComment)}
            onKeyDown={(e) => handleMentionKeyDown(e, textareaRef.current, setNewComment)}
            placeholder="添加评论... 使用 @ 来提及用户"
            className="comment-textarea"
            rows="3"
          />
          
          {/* @提及下拉菜单 */}
          {showMentions && mentionUsers.length > 0 && (
            <div className="mentions-dropdown" ref={mentionRef}>
              {mentionUsers.map((user, index) => (
                <div
                  key={user.id}
                  className={`mention-item ${index === selectedMentionIndex ? 'selected' : ''}`}
                  onClick={() => handleMentionSelect(user, textareaRef.current, setNewComment)}
                >
                  <span className="mention-username">@{user.username}</span>
                  <span className="mention-email">{user.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="comment-form-actions">
          <button 
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="submit-comment-btn"
          >
            {submitting ? '发送中...' : '发送评论'}
          </button>
        </div>
      </form>

      {/* 评论列表 */}
      <div className="comments-list">
        {loading ? (
          <div className="comments-loading">加载评论中...</div>
        ) : comments.length === 0 ? (
          <div className="no-comments">暂无评论，成为第一个评论的人吧！</div>
        ) : (
          comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;