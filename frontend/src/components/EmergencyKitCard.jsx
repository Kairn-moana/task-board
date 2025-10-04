import React from "react";
import "./EmergencyKitCard.css";

// 定义分类配置
const CATEGORY_CONFIG = {
  呼吸: {
    icon: "🌬️",
    color: "#60a5fa", // 蓝色
    bgColor: "rgba(96, 165, 250, 0.1)",
  },
  身体: {
    icon: "🧘‍♂️",
    color: "#10b981", // 绿色
    bgColor: "rgba(16, 185, 129, 0.1)",
  },
  认知: {
    icon: "🧠",
    color: "#8b5cf6", // 紫色
    bgColor: "rgba(139, 92, 246, 0.1)",
  },
  环境: {
    icon: "🪴",
    color: "#f59e0b", // 橙色
    bgColor: "rgba(245, 158, 11, 0.1)",
  },
};

function EmergencyKitCard({ title, duration, steps, category }) {
  const categoryInfo = CATEGORY_CONFIG[category];

  return (
    <div className="ek-card">
      <div className="ek-card-header">
        <div className="ek-header-main">
          <h3 className="ek-card-title">{title}</h3>
          <span className="ek-duration-tag">{duration} 分钟</span>
        </div>

        <div
          className="ek-category-tag"
          style={{
            color: categoryInfo.color,
            backgroundColor: categoryInfo.bgColor,
          }}
        >
          <span className="ek-category-icon">{categoryInfo.icon}</span>
          <span className="ek-category-text">{category}</span>
        </div>
      </div>

      <div className="ek-card-content">
        <h4 className="ek-steps-title">步骤</h4>
        <p className="ek-steps-content">{steps}</p>
      </div>
    </div>
  );
}

export default EmergencyKitCard;
