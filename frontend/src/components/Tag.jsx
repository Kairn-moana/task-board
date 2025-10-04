import React from 'react';
import './Tag.css';

const Tag = ({ 
  tag, 
  size = 'medium', // small, medium, large
  variant = 'default', // default, removable, clickable
  onClick, 
  onRemove,
  className = '',
  showIcon = true
}) => {
  const handleClick = () => {
    if (onClick && variant === 'clickable') {
      onClick(tag);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(tag);
    }
  };

  const tagClasses = [
    'tag',
    `tag-${size}`,
    `tag-${variant}`,
    variant === 'clickable' && onClick ? 'tag-clickable' : '',
    className
  ].filter(Boolean).join(' ');

  // 获取对比色（用于文字颜色）
  const getContrastColor = (backgroundColor) => {
    if (!backgroundColor) return '#000000';
    
    // 移除 # 符号
    const hex = backgroundColor.replace('#', '');
    
    // 转换为 RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // 计算亮度
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // 根据亮度选择对比色
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  const tagStyle = {
    backgroundColor: tag.color || '#3B82F6',
    color: getContrastColor(tag.color || '#3B82F6'),
    borderColor: tag.color || '#3B82F6'
  };

  return (
    <span 
      className={tagClasses}
      style={tagStyle}
      onClick={handleClick}
      title={tag.name}
    >
      {showIcon && size !== 'small' && (
        <span className="tag-icon">🏷️</span>
      )}
      <span className="tag-name">{tag.name}</span>
      {variant === 'removable' && (
        <button 
          className="tag-remove-btn"
          onClick={handleRemove}
          aria-label={`移除标签 ${tag.name}`}
        >
          ×
        </button>
      )}
    </span>
  );
};

// 标签列表组件
export const TagList = ({ 
  tags, 
  size = 'medium',
  variant = 'default',
  maxVisible = null,
  onTagClick,
  onTagRemove,
  className = ''
}) => {
  const visibleTags = maxVisible ? tags.slice(0, maxVisible) : tags;
  const hiddenCount = maxVisible ? Math.max(0, tags.length - maxVisible) : 0;

  return (
    <div className={`tag-list ${className}`}>
      {visibleTags.map((tag) => (
        <Tag
          key={tag.id}
          tag={tag}
          size={size}
          variant={variant}
          onClick={onTagClick}
          onRemove={onTagRemove}
        />
      ))}
      {hiddenCount > 0 && (
        <span className={`tag tag-${size} tag-more`}>
          +{hiddenCount}
        </span>
      )}
    </div>
  );
};

// 标签选择器组件
export const TagSelector = ({ 
  availableTags, 
  selectedTags = [], 
  onTagSelect,
  onTagDeselect,
  placeholder = "选择标签...",
  className = ''
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const dropdownRef = React.useRef(null);

  // 过滤可用标签
  const filteredTags = availableTags.filter(tag => 
    !selectedTags.some(selected => selected.id === tag.id) &&
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 点击外部关闭下拉框
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTagSelect = (tag) => {
    if (onTagSelect) {
      onTagSelect(tag);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleTagRemove = (tag) => {
    if (onTagDeselect) {
      onTagDeselect(tag);
    }
  };

  return (
    <div className={`tag-selector ${className}`} ref={dropdownRef}>
      {/* 已选择的标签 */}
      {selectedTags.length > 0 && (
        <TagList
          tags={selectedTags}
          size="small"
          variant="removable"
          onTagRemove={handleTagRemove}
          className="selected-tags"
        />
      )}

      {/* 选择器输入 */}
      <div className="tag-selector-input">
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="tag-search-input"
        />
        <button
          type="button"
          className="tag-selector-toggle"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? '▲' : '▼'}
        </button>
      </div>

      {/* 下拉选项 */}
      {isOpen && (
        <div className="tag-selector-dropdown">
          {filteredTags.length > 0 ? (
            filteredTags.map((tag) => (
              <div
                key={tag.id}
                className="tag-option"
                onClick={() => handleTagSelect(tag)}
              >
                <Tag tag={tag} size="small" variant="clickable" showIcon={false} />
              </div>
            ))
          ) : (
            <div className="tag-option-empty">
              {searchTerm ? '没有找到匹配的标签' : '没有可选标签'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Tag;