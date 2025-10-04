import React, { useState, useEffect } from "react";

import "./EmergencyKitModal.css";
import EmergencyKitCard from "./EmergencyKitCard";

// 添加分类配置
const CATEGORY_CONFIG = {
  呼吸: {
    icon: "🌬️",
    title: "呼吸练习",
    color: "#60a5fa",
  },
  身体: {
    icon: "🧘‍♂️",
    title: "身体练习",
    color: "#10b981",
  },
  认知: {
    icon: "🧠",
    title: "认知调节",
    color: "#8b5cf6",
  },
  环境: {
    icon: "🪴",
    title: "环境调节",
    color: "#f59e0b",
  },
};

const DEFAULT_KIT_ITEMS = [
  {
    id: 1,
    title: "4-7-8 呼吸法",
    duration: 5,
    steps: `1. 舒适地坐着或躺下。\n2. 用鼻子深深吸气，默数4秒。\n3. 屏住呼吸，默数7秒。\n4. 用嘴缓缓呼气，默数8秒。\n5. 重复3-5次。`,
    category: "呼吸",
  },
  {
    id: 2,
    title: "渐进式肌肉放松",
    duration: 10,
    steps: `步骤: 从脚趾开始，逐个绷紧身体的肌肉群（脚、小腿、大腿、臀部、腹部、手臂、肩膀、面部），每个部位保持5秒然后彻底放松10秒。`,
    category: "身体",
  },
  {
    id: 3,
    title: "5-4-3-2-1 感官练习",
    duration: 5,
    steps:
      "步骤: 找出并默念：\n- 5件你能看到的东西\n- 4件你能触摸到的东西\n- 3件你能听到的声音\n- 2样你能闻到的气味\n- 1种你能尝到的味道",
    category: "认知",
  },
  {
    id: 4,
    title: "倾斜困扰的事",
    category: "认知",
    steps: "🧠 写下现在困扰你的三件事，把它们“倒”出来",
    duration: 5,
  },
  {
    id: 5,
    category: "认知",
    title: "未来视角",
    steps: "🤔 问问自己：“五年后，这件事还重要吗？”",
    duration: 5,
  },
  {
    id: 6,
    title: "整理一个角落",
    duration: 10,
    steps:
      "步骤: 选择一个小的、可控的区域，比如书桌一角或一个抽屉，进行整理，创造小范围的秩序感。",
    category: "环境",
  },
  {
    id: 7,
    title: "听音乐",
    category: "环境",
    steps: "🎧 播放一首舒缓的音乐或白噪音",
    duration: 5,
  },
];

const groupByCategory = (items) => {
  return items.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});
};

function EmergencyKitModal({ isOpen, onClose }) {
  // 2. 使用 state 来管理清单项
  const [kitItems, setKitItems] = useState(DEFAULT_KIT_ITEMS);

  // 3. 实现点击“打勾”的交互逻辑
  const handleToggleComplete = (itemId) => {
    setKitItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  if (!isOpen) return null;

  // 添加这行来确认是否使用了最新的代码
  console.log("Emergency Kit Items:", DEFAULT_KIT_ITEMS);

  // 按分类分组
  const groupedItems = DEFAULT_KIT_ITEMS.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content emergency-kit-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="close-button">
          ×
        </button>
        <div className="ek-header">
          <h2>🧯 情绪急救包</h2>
          <p>当你感到不知所措时，尝试完成以下几项来平复心情。</p>
        </div>
        <div className="ek-content">
          {Object.entries(groupedItems).map(([category, items]) => (
            <section key={category} className="ek-section">
              <div className="ek-section-header">
                <h3>
                  {CATEGORY_CONFIG[category].icon}
                  {CATEGORY_CONFIG[category].title}
                </h3>
              </div>
              <div className="ek-cards">
                {items.map((item) => (
                  <EmergencyKitCard
                    key={item.id}
                    title={item.title}
                    duration={item.duration}
                    steps={item.steps}
                    category={item.category}
                  />
                ))}
              </div>
            </section>
          ))}
          {/* {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="ek-category">
              <h3 className="ek-category-title">{category}</h3>
              <ul>
                {items.map((item) => (
                  <li
                    key={item.id}
                    className={`ek-item ${item.completed ? "completed" : ""}`}
                    onClick={() => handleToggleComplete(item.id)}
                  >
                    <span className="ek-checkbox">
                      {item.completed ? "✔" : ""}
                    </span>
                    <span className="ek-item-text">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))} */}
        </div>
      </div>
    </div>
  );
}

export default EmergencyKitModal;
