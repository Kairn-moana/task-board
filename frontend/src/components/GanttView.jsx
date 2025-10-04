import { useMemo } from "react";

// 极简甘特图：基于卡片的 start_date - due_date 渲染水平条
export default function GanttView({ lists }) {
  const items = useMemo(() => {
    const cards = (lists || []).flatMap((l) => l.cards || []);
    return cards
      .filter((c) => c.start_date || c.due_date)
      .map((c) => ({
        id: c.id,
        title: c.title,
        start: c.start_date ? new Date(c.start_date) : null,
        end: c.due_date ? new Date(c.due_date) : null,
      }));
  }, [lists]);

  const minDate = useMemo(() => {
    const dates = items.flatMap((i) => [i.start, i.end].filter(Boolean));
    return dates.length ? new Date(Math.min(...dates)) : null;
  }, [items]);

  const maxDate = useMemo(() => {
    const dates = items.flatMap((i) => [i.start, i.end].filter(Boolean));
    return dates.length ? new Date(Math.max(...dates)) : null;
  }, [items]);

  if (!items.length) return <div style={{ padding: 16 }}>暂无带日期的卡片</div>;

  const dayMs = 24 * 3600 * 1000;
  const totalDays = Math.max(1, Math.ceil((maxDate - minDate) / dayMs) + 1);

  function toX(date) {
    if (!date) return 0;
    return ((date - minDate) / dayMs) * 32; // 32px/天
  }

  function width(start, end) {
    if (!start || !end) return 12;
    const days = Math.max(1, Math.ceil((end - start) / dayMs) + 1);
    return days * 32;
  }

  return (
    <div className="gantt" style={{ padding: 16 }}>
      <div
        className="gantt__header"
        style={{ display: "flex", gap: 8, marginBottom: 12 }}
      >
        {Array.from({ length: totalDays }).map((_, i) => {
          const d = new Date(minDate.getTime() + i * dayMs);
          const label = `${d.getMonth() + 1}/${d.getDate()}`;
          return (
            <div
              key={i}
              style={{
                width: 32,
                textAlign: "center",
                fontSize: 12,
                color: "#aaa",
              }}
            >
              {label}
            </div>
          );
        })}
      </div>
      <div
        className="gantt__rows"
        style={{ display: "flex", flexDirection: "column", gap: 8 }}
      >
        {items.map((i) => (
          <div
            key={i.id}
            style={{
              position: "relative",
              height: 24,
              background: "transparent",
            }}
          >
            <div
              title={`${i.title}`}
              style={{
                position: "absolute",
                left: toX(i.start),
                width: width(i.start, i.end),
                height: 24,
                background: "var(--color-primary)",
                color: "#fff",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                padding: "0 8px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {i.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

