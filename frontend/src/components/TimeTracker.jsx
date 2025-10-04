import { useEffect, useState } from "react";
import { timeService } from "../api/services/timeService.js";

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h ? `${h}h` : null, m ? `${m}m` : null, !h && !m ? `${s}s` : null]
    .filter(Boolean)
    .join(" ");
}

export default function TimeTracker({ cardId }) {
  const [entries, setEntries] = useState([]);
  const [running, setRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  async function load() {
    setLoading(true);
    const [listRes, sumRes] = await Promise.all([
      timeService.listEntries(cardId),
      timeService.getCardSummary(cardId),
    ]);

    if (listRes.success) setEntries(listRes.data);
    if (sumRes.success) setTotalSeconds(sumRes.data.total_seconds || 0);
    setRunning(
      listRes.success && listRes.data.some((e) => e.end_time === null)
    );
    setLoading(false);
  }

  useEffect(() => {
    if (cardId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  async function handleStart() {
    const res = await timeService.startTimer(cardId, note);
    if (res.success) {
      setNote("");
      await load();
    }
  }

  async function handleStop() {
    const res = await timeService.stopTimer(note);
    if (res.success) {
      setNote("");
      await load();
    }
  }

  return (
    <div className="time-tracker">
      <div className="time-tracker__controls">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="备注（可选）"
        />
        {running ? (
          <button onClick={handleStop} disabled={loading}>
            停止计时
          </button>
        ) : (
          <button onClick={handleStart} disabled={loading}>
            开始计时
          </button>
        )}
        <div className="time-tracker__total">
          总计：{formatDuration(totalSeconds)}
        </div>
      </div>
      <ul className="time-tracker__list">
        {entries.map((e) => (
          <li key={e.id}>
            <span>{new Date(e.start_time).toLocaleString()}</span>
            {" → "}
            <span>
              {e.end_time ? new Date(e.end_time).toLocaleString() : "进行中"}
            </span>
            {e.duration_seconds
              ? `（${formatDuration(e.duration_seconds)}）`
              : ""}
            {e.note ? ` - ${e.note}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

