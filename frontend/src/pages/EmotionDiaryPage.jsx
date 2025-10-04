// export default EmotionDiaryPage;
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getEmotionLogHistory } from "../api/services/emotionService";
import EmotionCharts from "../components/EmotionCharts"; // 引入图表组件
import MonthlySummaryCard from "../components/MonthlySummaryCard";
import "./EmotionDiaryPage.css";

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function EmotionDiaryPage() {
  const [allEntries, setAllEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();

  // 手动筛选的状态
  const [tagFilter, setTagFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState(""); // 'morning', 'afternoon', 'evening'
  const [dayTypeFilter, setDayTypeFilter] = useState(""); // 'weekday', 'weekend'

  const filteredEntries = useMemo(() => {
    let entries = [...allEntries];
    const urlFilter = searchParams.get("filter");

    // 1. URL 筛选 (来自图表点击)
    if (urlFilter) {
      const [type, value] = urlFilter.split(":");
      if (type === "date") {
        entries = entries.filter((entry) =>
          new Date(entry.created_at).toISOString().startsWith(value)
        );
      } else if (type === "emotion") {
        entries = entries.filter((entry) => entry.emotion === value);
      }
    }

    // 2. 手动筛选
    if (tagFilter) {
      entries = entries.filter((entry) =>
        entry.tags.some((tag) => tag.name === tagFilter)
      );
    }
    // ... (Add logic for timeFilter and dayTypeFilter) ...

    return entries;
  }, [allEntries, searchParams, tagFilter, timeFilter, dayTypeFilter]);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      try {
        const history = await getEmotionLogHistory();
        setAllEntries(history);
      } catch (error) {
        console.error("无法加载情绪日记:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, []);

  // 提取所有唯一的标签用于筛选器
  const allTags = useMemo(() => {
    const tags = new Set();
    allEntries.forEach((entry) =>
      entry.tags.forEach((tag) => tags.add(tag.name))
    );
    return Array.from(tags);
  }, [allEntries]);

  if (isLoading) {
    return <div className="diary-page-container">正在加载日记...</div>;
  }

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  return (
    <div className="diary-page-container">
      <header className="diary-page-header">
        <h1>📖 我的情绪日记</h1>
        <p>回顾每一天的心情，更好地了解自己。</p>
      </header>

      {/* 显示当月的总结卡 */}
      <MonthlySummaryCard year={currentYear} month={currentMonth} />

      {/* 渲染图表 */}
      <div className="diary-charts-section">
        <EmotionCharts logs={allEntries} />
      </div>

      {/* 筛选区域 */}
      <div className="diary-filters">
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
        >
          <option value="">按标签筛选</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        {/* TODO: Add more filters for time and day type */}
      </div>

      <div className="diary-list">
        {filteredEntries.length === 0 ? (
          <p>还没有任何记录。</p>
        ) : (
          filteredEntries.map((entry) => (
            <div key={entry.id} className="diary-entry-card">
              <div className="diary-entry-header">
                <span className="diary-entry-emotion">{entry.emotion}</span>
                <span className="diary-entry-date">
                  {formatDate(entry.created_at)}
                </span>
              </div>
              {entry.notes && <p className="diary-entry-note">{entry.notes}</p>}
              {entry.tags && entry.tags.length > 0 && (
                <div className="diary-entry-tags">
                  {entry.tags.map((tag) => (
                    <span key={tag.id} className="diary-tag">
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default EmotionDiaryPage;
