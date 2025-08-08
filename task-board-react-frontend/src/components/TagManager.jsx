import React, { useState, useEffect } from 'react';
import { getBoardTags, createTag, updateTag, deleteTag } from '../api';
import { useToast } from './Toast';
import Tag, { TagList } from './Tag';
import './TagManager.css';

const TagManager = ({ boardId, isOpen, onClose, onTagsUpdated }) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [newTag, setNewTag] = useState({ name: '', color: '#3B82F6' });
  const [isCreating, setIsCreating] = useState(false);
  const toast = useToast();

  // 预设颜色选项
  const colorPresets = [
    { name: '蓝色', value: '#3B82F6' },
    { name: '红色', value: '#EF4444' },
    { name: '绿色', value: '#10B981' },
    { name: '橙色', value: '#F97316' },
    { name: '紫色', value: '#8B5CF6' },
    { name: '黄色', value: '#F59E0B' },
    { name: '粉色', value: '#EC4899' },
    { name: '青色', value: '#06B6D4' },
    { name: '灰色', value: '#6B7280' },
    { name: '深蓝', value: '#1E40AF' },
    { name: '深绿', value: '#065F46' },
    { name: '深红', value: '#991B1B' }
  ];

  // 加载标签
  const loadTags = async () => {
    if (!boardId) return;
    
    setLoading(true);
    try {
      const response = await getBoardTags(boardId);
      if (response.ok) {
        const tagsData = await response.json();
        setTags(tagsData);
      } else {
        const errorData = await response.json();
        toast.error(`加载标签失败: ${errorData.msg || '未知错误'}`);
      }
    } catch (error) {
      console.error('加载标签失败:', error);
      toast.error('加载标签失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && boardId) {
      loadTags();
    }
  }, [isOpen, boardId]);

  // 创建标签
  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      toast.error('请输入标签名称');
      return;
    }

    setIsCreating(true);
    try {
      const response = await createTag({
        name: newTag.name.trim(),
        color: newTag.color,
        boardId
      });

      if (response.ok) {
        const createdTag = await response.json();
        setTags(prev => [...prev, createdTag]);
        setNewTag({ name: '', color: '#3B82F6' });
        toast.success('标签创建成功');
        onTagsUpdated && onTagsUpdated();
      } else {
        const errorData = await response.json();
        toast.error(`创建标签失败: ${errorData.msg || '未知错误'}`);
      }
    } catch (error) {
      console.error('创建标签失败:', error);
      toast.error('创建标签失败');
    } finally {
      setIsCreating(false);
    }
  };

  // 更新标签
  const handleUpdateTag = async (tagId, updatedData) => {
    try {
      const response = await updateTag(tagId, updatedData);
      
      if (response.ok) {
        const updatedTag = await response.json();
        setTags(prev => prev.map(tag => 
          tag.id === tagId ? updatedTag : tag
        ));
        setEditingTag(null);
        toast.success('标签更新成功');
        onTagsUpdated && onTagsUpdated();
      } else {
        const errorData = await response.json();
        toast.error(`更新标签失败: ${errorData.msg || '未知错误'}`);
      }
    } catch (error) {
      console.error('更新标签失败:', error);
      toast.error('更新标签失败');
    }
  };

  // 删除标签
  const handleDeleteTag = async (tagId) => {
    if (!confirm('确定要删除这个标签吗？这将从所有卡片上移除该标签。')) {
      return;
    }

    try {
      const response = await deleteTag(tagId);
      
      if (response.ok) {
        setTags(prev => prev.filter(tag => tag.id !== tagId));
        toast.success('标签删除成功');
        onTagsUpdated && onTagsUpdated();
      } else {
        const errorData = await response.json();
        toast.error(`删除标签失败: ${errorData.msg || '未知错误'}`);
      }
    } catch (error) {
      console.error('删除标签失败:', error);
      toast.error('删除标签失败');
    }
  };

  const handleEditStart = (tag) => {
    setEditingTag({ ...tag });
  };

  const handleEditSave = () => {
    if (!editingTag.name.trim()) {
      toast.error('请输入标签名称');
      return;
    }
    
    handleUpdateTag(editingTag.id, {
      name: editingTag.name.trim(),
      color: editingTag.color
    });
  };

  const handleEditCancel = () => {
    setEditingTag(null);
  };

  if (!isOpen) return null;

  return (
    <div className="tag-manager-backdrop" onClick={onClose}>
      <div className="tag-manager-modal" onClick={e => e.stopPropagation()}>
        <div className="tag-manager-header">
          <h2>标签管理</h2>
          <button className="tag-manager-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="tag-manager-content">
          {/* 创建新标签 */}
          <div className="tag-create-section">
            <h3>创建新标签</h3>
            <div className="tag-create-form">
              <div className="tag-create-input">
                <input
                  type="text"
                  placeholder="标签名称"
                  value={newTag.name}
                  onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                  maxLength={20}
                />
                <input
                  type="color"
                  value={newTag.color}
                  onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                  className="color-picker"
                />
              </div>
              
              {/* 预设颜色 */}
              <div className="color-presets">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    className={`color-preset ${newTag.color === preset.value ? 'active' : ''}`}
                    style={{ backgroundColor: preset.value }}
                    onClick={() => setNewTag(prev => ({ ...prev, color: preset.value }))}
                    title={preset.name}
                  />
                ))}
              </div>

              <div className="tag-create-preview">
                预览: <Tag tag={newTag} size="medium" />
              </div>

              <button
                className="tag-create-btn"
                onClick={handleCreateTag}
                disabled={isCreating || !newTag.name.trim()}
              >
                {isCreating ? '创建中...' : '创建标签'}
              </button>
            </div>
          </div>

          {/* 现有标签列表 */}
          <div className="tag-list-section">
            <h3>现有标签 ({tags.length})</h3>
            
            {loading ? (
              <div className="tag-manager-loading">加载中...</div>
            ) : tags.length === 0 ? (
              <div className="tag-manager-empty">
                还没有标签，创建第一个标签吧！
              </div>
            ) : (
              <div className="tag-manager-list">
                {tags.map((tag) => (
                  <div key={tag.id} className="tag-manager-item">
                    {editingTag && editingTag.id === tag.id ? (
                      // 编辑模式
                      <div className="tag-edit-form">
                        <div className="tag-edit-input">
                          <input
                            type="text"
                            value={editingTag.name}
                            onChange={(e) => setEditingTag(prev => ({ ...prev, name: e.target.value }))}
                            maxLength={20}
                          />
                          <input
                            type="color"
                            value={editingTag.color}
                            onChange={(e) => setEditingTag(prev => ({ ...prev, color: e.target.value }))}
                            className="color-picker"
                          />
                        </div>
                        
                        <div className="color-presets">
                          {colorPresets.map((preset) => (
                            <button
                              key={preset.value}
                              className={`color-preset ${editingTag.color === preset.value ? 'active' : ''}`}
                              style={{ backgroundColor: preset.value }}
                              onClick={() => setEditingTag(prev => ({ ...prev, color: preset.value }))}
                              title={preset.name}
                            />
                          ))}
                        </div>

                        <div className="tag-edit-preview">
                          预览: <Tag tag={editingTag} size="medium" />
                        </div>

                        <div className="tag-edit-actions">
                          <button className="btn-save" onClick={handleEditSave}>
                            保存
                          </button>
                          <button className="btn-cancel" onClick={handleEditCancel}>
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 显示模式
                      <div className="tag-display">
                        <Tag tag={tag} size="medium" />
                        <div className="tag-actions">
                          <button
                            className="btn-edit"
                            onClick={() => handleEditStart(tag)}
                            title="编辑标签"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteTag(tag.id)}
                            title="删除标签"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagManager;