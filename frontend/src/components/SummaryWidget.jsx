import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyticsService } from "../api/services";
import { ResponsiveContainer, BarChart, Bar } from "recharts";

const CACHE_KEY = "summary_cache_v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj?.ts || Date.now() - obj.ts > CACHE_TTL_MS) return null;
    return obj.data;
  } catch {
    return null;
  }
}
function saveCache(data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
}

export default function SummaryWidget({ days = 7 }) {
  const [data, setData] = useState(loadCache());
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (data) return;
    setLoading(true);
    analyticsService
      .getSummary(days)
      .then((res) => {
        setData(res.data);
        saveCache(res.data);
      })
      .catch(() => setError("无法加载每日小结"))
      .finally(() => setLoading(false));
  }, [days]); // eslint-disable-line

  const sparkStarts = useMemo(() => {
    if (!data?.series) return [];
    return data.series.days.map((d, i) => ({
      x: i,
      v: data.series.starts[i] || 0,
    }));
  }, [data]);
  const sparkMinutes = useMemo(() => {
    if (!data?.series) return [];
    return data.series.days.map((d, i) => ({
      x: i,
      v: data.series.minutes[i] || 0,
    }));
  }, [data]);
  const sparkDone = useMemo(() => {
    if (!data?.series) return [];
    return data.series.days.map((d, i) => ({
      x: i,
      v: data.series.done[i] || 0,
    }));
  }, [data]);

  function startQuick(minutes = 20) {
    const q = new URLSearchParams({ title: "快速开始", dur: String(minutes) });
    navigate(`/focus?${q.toString()}`);
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: 12,
        border: "1px solid #334155",
        borderRadius: 12,
        background: "var(--card-bg, #0f172a)",
        color: "var(--card-fg, #e5e7eb)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          minWidth: 520,
        }}
      >
        <Metric
          title="起步次数"
          value={data?.today?.starts ?? "-"}
          spark={sparkStarts}
        />
        <Metric
          title="出勤分钟"
          value={data?.today?.minutes ?? "-"}
          spark={sparkMinutes}
        />
        <Metric
          title="完成数"
          value={data?.today?.done ?? "-"}
          spark={sparkDone}
        />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          justifyContent: "space-between",
        }}
      >
        {loading && <span>加载中...</span>}
        {error && <span style={{ color: "#ef4444" }}>{error}</span>}
        {!loading && !error && (
          <>
            <div style={{ color: "#94a3b8" }}>
              黄金起步时段：
              {(data?.golden_hours || []).map((h, idx) => (
                <span key={h}>
                  {String(h).padStart(2, "0")}:00
                  {idx === 0 && data.golden_hours.length > 1 ? "、" : ""}
                </span>
              ))}
            </div>
            <div>
              <button className="btn" onClick={() => startQuick(20)}>
                立即开始 20 分钟
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ title, value, spark }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid #334155",
        borderRadius: 12,
        padding: 10,
      }}
    >
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ height: 36 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={spark}>
            <Bar dataKey="v" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
