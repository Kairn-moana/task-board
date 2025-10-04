import { useMemo } from "react";

// 极简月视图：把有 due_date 的卡片放到对应日期
export default function CalendarView({ lists }) {
  const cards = useMemo(
    () => (lists || []).flatMap((l) => l.cards || []),
    [lists]
  );
  const dueMap = useMemo(() => {
    const map = new Map();
    cards.forEach((c) => {
      if (!c.due_date) return;
      const key = new Date(c.due_date).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(c);
    });
    return map;
  }, [cards]);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  const startWeekday = first.getDay();
  const totalDays = last.getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null); // leading blanks
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));

  return (
    <div className="calendar" style={{ padding: 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 8,
        }}
      >
        {["日", "一", "二", "三", "四", "五", "六"].map((w) => (
          <div key={w} style={{ textAlign: "center", color: "#aaa" }}>
            {w}
          </div>
        ))}
        {cells.map((date, idx) => {
          const key = date ? date.toDateString() : `blank-${idx}`;
          const items = date ? dueMap.get(key) || [] : [];
          return (
            <div
              key={key}
              style={{
                minHeight: 96,
                border: "1px solid #333",
                borderRadius: 6,
                padding: 6,
              }}
            >
              <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>
                {date ? date.getDate() : ""}
              </div>
              {items.map((c) => (
                <div
                  key={c.id}
                  style={{
                    fontSize: 12,
                    background: "var(--color-elev-2)",
                    padding: "2px 6px",
                    borderRadius: 4,
                    marginBottom: 4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

