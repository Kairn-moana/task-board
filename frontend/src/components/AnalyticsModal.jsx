import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { analyticsService } from "../api/services";
import { useMemo } from "react";
import "./AnalyticsModal.css";
import { TagList } from "./Tag";

const COLORS = {
  冷静: "#60a5fa",
  焦虑: "#f59e0b",
  紧张: "#ef4444",
  愉快: "#10b981",
};

// 接收一个新的 prop `isPage`，默认为 false
function AnalyticsModal({ isOpen, onClose, isPage = false }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [timelineData, setTimelineData] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [timelineError, setTimelineError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [days, setDays] = useState(30);
  // 拉数据时用 days；emotion-timeline 本地再按 cutoff 过滤
  const cutoff = useMemo(() => Date.now() - days * 24 * 60 * 60 * 1000, [days]);

  // 专注会话（可选模块）
  const focusEnabled =
    typeof window !== "undefined" &&
    localStorage.getItem("enableFocusAnalytics") === "true";
  const [focusData, setFocusData] = useState([]);
  const [focusLoading, setFocusLoading] = useState(false);
  const [focusError, setFocusError] = useState(null);

  const [selectedEmotion, setSelectedEmotion] = useState("ALL");
  // 基于天数与情绪的过滤后的时间线
  const filteredTimeline = useMemo(() => {
    if (!timelineData || timelineData.length === 0) return [];
    return timelineData.filter((i) => {
      const t = new Date(i.completed_at).getTime();
      const inRange = t >= cutoff;
      const emoOk = selectedEmotion === "ALL" || i.emotion === selectedEmotion;
      return inRange && emoOk;
    });
  }, [timelineData, cutoff, selectedEmotion]);

  useEffect(() => {
    if (!isOpen) return;

    // 基础数据（完成趋势 + 情绪聚合）
    setLoading(true);
    analyticsService
      .getAnalytics(days)
      .then((response) => setData(response.data))
      .catch(() => setError("无法加载分析数据"))
      .finally(() => setLoading(false));

    // 情绪时间线（固定接口，前端再按 days/emotion 过滤）
    setTimelineLoading(true);
    analyticsService
      .getEmotionTimeline()
      .then((response) => setTimelineData(response.data))
      .catch(() => setTimelineError("无法加载情绪时间线"))
      .finally(() => setTimelineLoading(false));
  }, [isOpen, days]);

  // --- 使用 useMemo 处理和聚合数据 ---
  const { groupedTimeline, emotionTagStats } = useMemo(() => {
    if (!filteredTimeline || filteredTimeline.length === 0) {
      return { groupedTimeline: {}, emotionTagStats: {} };
    }

    // 1. 按日期分组
    const grouped = filteredTimeline.reduce((acc, item) => {
      const date = new Date(item.completed_at).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {});

    // 2. 情绪-标签统计
    const stats = {};
    filteredTimeline.forEach((item) => {
      if (item.emotion && item.tags && item.tags.length > 0) {
        if (!stats[item.emotion]) stats[item.emotion] = {};
        item.tags.forEach((tag) => {
          if (!stats[item.emotion][tag.name]) {
            stats[item.emotion][tag.name] = { ...tag, count: 0 };
          }
          stats[item.emotion][tag.name].count++;
        });
      }
    });

    // 排序
    for (const emotion in stats) {
      stats[emotion] = Object.values(stats[emotion]).sort(
        (a, b) => b.count - a.count
      );
    }
    return { groupedTimeline: grouped, emotionTagStats: stats };
  }, [filteredTimeline]);

  // 完成时段（近30天，按小时统计完成次数）
  // 完成时段（近 N 天，按小时统计完成次数）
  const hourlyCompletion = useMemo(() => {
    if (!filteredTimeline || filteredTimeline.length === 0) {
      return Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
    }
    const buckets = Array.from({ length: 24 }, () => 0);
    filteredTimeline.forEach((item) => {
      const h = new Date(item.completed_at).getHours();
      buckets[h]++;
    });
    return buckets.map((count, hour) => ({ hour, count }));
  }, [filteredTimeline]);

  // 首次完成时间分布（每天取最早完成的小时）
  const firstCompletionDist = useMemo(() => {
    if (!filteredTimeline || filteredTimeline.length === 0) {
      return Array.from({ length: 24 }, (_, hour) => ({ hour, days: 0 }));
    }
    const earliestByDate = {};
    filteredTimeline.forEach((item) => {
      const t = new Date(item.completed_at);
      const d = t.toISOString().slice(0, 10);
      const h = t.getHours();
      if (!(d in earliestByDate) || h < earliestByDate[d])
        earliestByDate[d] = h;
    });
    const buckets = Array.from({ length: 24 }, () => 0);
    Object.values(earliestByDate).forEach(
      (h) => (buckets[h] = (buckets[h] || 0) + 1)
    );
    return buckets.map((days, hour) => ({ hour, days }));
  }, [filteredTimeline]);

  // 黄金起步时段（近 N 天“首次完成”的 Top2 小时）
  const goldenHoursText = useMemo(() => {
    const top = [...firstCompletionDist]
      .filter((d) => d.days > 0)
      .sort((a, b) => b.days - a.days)
      .slice(0, 2)
      .map((d) => `${String(d.hour).padStart(2, "0")}:00`);
    if (top.length === 0) return "暂无数据";
    if (top.length === 1) return `${top[0]}`;
    return `${top[0]}、${top[1]}`;
  }, [firstCompletionDist]);
  if (!isOpen) return null;

  const emotionData = data.reduce((acc, day) => {
    if (day.emotion_calm > 0)
      acc.push({ name: "冷静", value: day.emotion_calm });
    if (day.emotion_anxious > 0)
      acc.push({ name: "焦虑", value: day.emotion_anxious });
    if (day.emotion_tense > 0)
      acc.push({ name: "紧张", value: day.emotion_tense });
    if (day.emotion_happy > 0)
      acc.push({ name: "愉快", value: day.emotion_happy });
    return acc;
  }, []);

  // Aggregate emotion data
  const aggregatedEmotionData = data.reduce((acc, day) => {
    // 检查并累加'冷静'情绪
    if (day.emotion_calm > 0) {
      const existing = acc.find((item) => item.name === "冷静");
      if (existing) existing.value += day.emotion_calm;
      else acc.push({ name: "冷静", value: day.emotion_calm });
    }
    // 检查并累加'焦虑'情绪
    if (day.emotion_anxious > 0) {
      const existing = acc.find((item) => item.name === "焦虑");
      if (existing) existing.value += day.emotion_anxious;
      else acc.push({ name: "焦虑", value: day.emotion_anxious });
    }
    // 检查并累加'紧张'情绪
    if (day.emotion_tense > 0) {
      const existing = acc.find((item) => item.name === "紧张");
      if (existing) existing.value += day.emotion_tense;
      else acc.push({ name: "紧张", value: day.emotion_tense });
    }
    // 检查并累加'愉快'情绪
    if (day.emotion_happy > 0) {
      const existing = acc.find((item) => item.name === "愉快");
      if (existing) existing.value += day.emotion_happy;
      else acc.push({ name: "愉快", value: day.emotion_happy });
    }
    return acc;
  }, []);

  // 专注会话：按小时聚合
  const hourlyFocus = useMemo(() => {
    if (!focusData || focusData.length === 0) return [];
    const sessions = Array.from({ length: 24 }, () => 0);
    const effective = Array.from({ length: 24 }, () => 0);
    focusData.forEach((row) => {
      const h = Number(row.hour);
      sessions[h] += Number(row.sessions);
      effective[h] += Number(row.effective_sessions);
    });

    return sessions.map((v, i) => ({
      hour: i, // 0-23
      sessions: v,
      effective: effective[i],
    }));
  }, [focusData]);

  const hasFocusData = useMemo(
    () => hourlyFocus.some((d) => d.sessions > 0 || d.effective > 0),
    [hourlyFocus]
  );

  const content = (
    <>
      <h2>数据分析</h2>
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          margin: "8px 0 16px",
        }}
      >
        <div>
          <button
            onClick={() => setDays(7)}
            className={days === 7 ? "btn-active" : "btn"}
          >
            7天
          </button>
          <button
            onClick={() => setDays(30)}
            className={days === 30 ? "btn-active" : "btn"}
            style={{ marginLeft: 8 }}
          >
            30天
          </button>
          <button
            onClick={() => setDays(90)}
            className={days === 90 ? "btn-active" : "btn"}
            style={{ marginLeft: 8 }}
          >
            90天
          </button>
        </div>
        <div>
          <label style={{ marginRight: 8 }}>情绪筛选</label>
          <select
            value={selectedEmotion}
            onChange={(e) => setSelectedEmotion(e.target.value)}
          >
            <option value="ALL">全部</option>
            <option value="冷静">冷静</option>
            <option value="愉快">愉快</option>
            <option value="焦虑">焦虑</option>
            <option value="紧张">紧张</option>
          </select>
        </div>
        <div style={{ marginLeft: "auto", color: "#6b7280" }}>
          黄金起步时段：{goldenHoursText}
        </div>
      </div>

      <button className="modal-close-btn" onClick={onClose}>
        ×
      </button>
      {loading && <p>加载中...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="charts-container">
          <div className="chart-wrapper">
            <h3>最近30天完成任务数</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tasks_completed" fill="#8884d8" name="完成数" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-wrapper">
            <h3>情绪分布</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={aggregatedEmotionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {aggregatedEmotionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-wrapper">
            <h3>完成时段（近{days}天）</h3>
            {hourlyCompletion.every((d) => d.count === 0) ? (
              <p style={{ color: "#6b7280" }}>近{days}天暂无完成数据。</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyCompletion}>
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#94a3b8" name="完成次数" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-wrapper">
            <h3>首次完成时间分布（近{days}天）</h3>
            {firstCompletionDist.every((d) => d.days === 0) ? (
              <p style={{ color: "#6b7280" }}>近{days}天暂无首次完成记录。</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={firstCompletionDist}>
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="days" fill="#60a5fa" name="天数" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {focusEnabled && (
            <div className="chart-wrapper">
              <h3>专注时段（近30天）</h3>
              {!focusLoading &&
                !focusError &&
                (hasFocusData ? (
                  <ResponsiveContainer width="100%" height={300}>
                    {/* BarChart 保持不变 */}
                  </ResponsiveContainer>
                ) : (
                  <p style={{ color: "#6b7280" }}>
                    暂无专注会话数据。开始一次计时后即可看到你的高效时段。
                  </p>
                ))}
              {focusError && <p className="error">{focusError}</p>}
              {!focusLoading && !focusError && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hourlyFocus}>
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sessions" fill="#94a3b8" name="启动次数" />
                    <Bar dataKey="effective" fill="#22c55e" name="≥5分钟" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>
      )}
      {/* --- 情绪时间线和统计区域 --- */}
      <div className="timeline-section">
        <h3>情绪日志时间线</h3>
        {timelineLoading && <p>加载中...</p>}
        {timelineError && <p className="error">{timelineError}</p>}
        {!timelineLoading &&
          !timelineError &&
          Object.keys(groupedTimeline).length > 0 && (
            <div className="timeline-and-stats">
              <div className="timeline-container">
                {Object.entries(groupedTimeline).map(([date, items]) => (
                  <div key={date} className="timeline-day">
                    <h4 className="timeline-date">{date}</h4>
                    <ul className="timeline-items">
                      {items.map((item) => (
                        <li key={item.id} className="timeline-item">
                          <span
                            className="timeline-emotion"
                            style={{
                              backgroundColor: `${COLORS[item.emotion]}33`, // 加上透明度
                              color: COLORS[item.emotion],
                              border: `1px solid ${COLORS[item.emotion]}`,
                            }}
                          >
                            {item.emotion}
                          </span>
                          <span className="timeline-title">
                            {item.card_title}
                          </span>
                          <div className="timeline-tags">
                            <TagList tags={item.tags} size="small" />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="stats-container">
                <h4>情绪与标签关联分析</h4>
                {Object.keys(emotionTagStats).length > 0 ? (
                  Object.entries(emotionTagStats).map(([emotion, tags]) => (
                    <div key={emotion} className="emotion-stat">
                      <h5
                        className="stat-emotion-title"
                        style={{ color: COLORS[emotion] }}
                      >
                        在「{emotion}」时，你最常完成...
                      </h5>
                      <TagList tags={tags} showCount={true} />
                    </div>
                  ))
                ) : (
                  <p>暂无足够数据进行分析。</p>
                )}
              </div>
            </div>
          )}
      </div>
    </>
  );

  // 如果是作为页面使用，直接返回内容
  if (isPage) {
    return <div className="analytics-content-wrapper">{content}</div>;
  }

  // 否则，作为模态框使用
  return (
    <div className={`modal-overlay ${isOpen ? "show" : ""}`} onClick={onClose}>
      <div
        className="modal-content analytics-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {content}
        <button onClick={onClose} className="close-button">
          ×
        </button>
      </div>
    </div>
  );
}

export default AnalyticsModal;
