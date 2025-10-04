import { api } from "../utils/apiUtils.js";

const KEY = "focus_session_v1";
const isNumericId = (v) => /^\d+$/.test(String(v || ""));

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}
export function saveSession(s) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
export function clearSession() {
  localStorage.removeItem(KEY);
}

export async function startFocus({ cardId, title, minutes }) {
  const startTs = new Date().toISOString();
  const totalSec = Math.max(1, Math.round(minutes * 60));
  const session = {
    id: `${Date.now()}`,
    cardId,
    title,
    startTs,
    totalSec,
    remainingSec: totalSec,
    state: "running",
  };
  saveSession(session);

  // 后端可用则记录 time_entries.start
  if (isNumericId(cardId)) {
    try {
      await api.post("/time-entries/start", { cardId: Number(cardId) });
    } catch {}
  }

  return session;
}

export function pause() {
  const s = getSession();
  if (!s) return null;
  s.state = "paused";
  saveSession(s);
  return s;
}
export function resume() {
  const s = getSession();
  if (!s) return null;
  s.state = "running";
  saveSession(s);
  return s;
}
export function tick() {
  const s = getSession();
  if (!s) return null;
  if (s.state !== "running") return s;
  s.remainingSec = Math.max(0, s.remainingSec - 1);
  saveSession(s);
  return s;
}

export async function endFocus({ markDone, addMoreMin, emotion } = {}) {
  const s = getSession();
  if (!s) return null;
  const endTs = new Date().toISOString();
  const ended = { ...s, endTs, emotion, state: "ended" };

  // 后端：停止计时；并尝试标记完成
  if (isNumericId(s.cardId)) {
    try {
      await api.post("/time-entries/stop", { note: emotion || null });
    } catch {}
    if (markDone) {
      try {
        await api.put(`/cards/${s.cardId}`, { status: "Done" });
      } catch {}
    }
    // 可选：如果你将来提供 completion_logs 的接口，可在此补充 emotion 打点
  }

  clearSession();
  return { session: ended, markDone: !!markDone, addMoreMin: addMoreMin || 0 };
}
