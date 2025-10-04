import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  endFocus,
  getSession,
  pause,
  resume,
  startFocus,
  tick,
} from "../utils/focus";
import FocusEndDialog from "../components/FocusEndDialog";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function FocusFullscreen() {
  const q = useQuery();
  const navigate = useNavigate();
  const cardId = q.get("cardId") || "";
  const title = q.get("title") || "";
  const next = q.get("next") || "";
  const dur = Number(q.get("dur") || "20");

  const [session, setSession] = useState(() => getSession());
  const [showEnd, setShowEnd] = useState(false);

  useEffect(() => {
    if (!session || session.state === "ended") {
      const s = startFocus({ cardId, title, minutes: dur });
      setSession(s);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    const id = setInterval(() => {
      const s = tick();
      if (!s) return;
      setSession({ ...s });
      if (s.remainingSec <= 0) {
        clearInterval(id);
        setShowEnd(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // 键盘：Space 暂停/继续；Esc 结束
  useEffect(() => {
    function onKey(e) {
      if (e.code === "Space") {
        e.preventDefault();
        onPauseResume();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowEnd(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session]);

  function onPauseResume() {
    if (!session) return;
    const s = session.state === "running" ? pause() : resume();
    setSession({ ...s });
  }
  function onEnd() {
    setShowEnd(true);
  }
  async function handleSubmit(payload) {
    const result = await endFocus(payload);
    setShowEnd(false);
    if (result?.addMoreMin) {
      const s = startFocus({ cardId, title, minutes: result.addMoreMin });
      setSession(s);
      return;
    }
    navigate("/today");
  }

  if (!session) return null;

  const mm = String(Math.floor(session.remainingSec / 60)).padStart(2, "0");
  const ss = String(session.remainingSec % 60).padStart(2, "0");

  return (
    <section
      style={{
        position: "fixed",
        inset: 0,
        background: "#0b1020",
        color: "#e5e7eb",
        display: "grid",
        placeItems: "center",
        gap: 16,
      }}
    >
      <h1 style={{ fontSize: 24 }}>{title || "专注中"}</h1>
      {next && <div style={{ color: "#94a3b8" }}>下一步：{next}</div>}
      <div style={{ fontSize: 96, fontVariantNumeric: "tabular-nums" }}>
        {mm}:{ss}
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn" onClick={onPauseResume}>
          {session.state === "running" ? "暂停 (Space)" : "继续 (Space)"}
        </button>
        <button className="btn" onClick={onEnd}>
          结束 (Esc)
        </button>
      </div>

      <FocusEndDialog
        open={showEnd}
        card={{ id: cardId, title }}
        defaultEmotion="neutral"
        onClose={() => setShowEnd(false)}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
