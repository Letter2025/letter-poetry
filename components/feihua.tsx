"use client";

import { useState } from "react";
import { callAi } from "@/lib/use-ai";

type Round = { char: string; answer: string };

// [LETTER-POETRY-PLAN-012#3] AI 飞花令：用户出字 → AI 接含该字的诗句 + 出处；前端保留多轮历史
export function Feihua() {
  const [char, setChar] = useState("");
  const [busy, setBusy] = useState(false);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [error, setError] = useState("");

  const play = async () => {
    const c = char.trim();
    if (!c || c.length > 10 || busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await callAi({ mode: "feihua", extra: c });
      setRounds((prev) => [...prev, { char: c, answer: r.content }]);
      setChar("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ai-panel">
      <div className="ai-panel-head">
        <span className="eyebrow"><span className="blue">{"//"}</span> AI 飞花令</span>
        <span className="ai-hint">你出字 · AI 接句 · 可多轮</span>
      </div>
      <div className="ai-ask-row">
        <input
          className="ai-input"
          value={char}
          maxLength={10}
          onChange={(e) => setChar(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) play();
          }}
          placeholder="出一个字，如「月」"
          aria-label="飞花令出字"
        />
        <button className="button dark" onClick={play} disabled={busy || !char.trim()}>
          {busy ? "接句中…" : "接句"}
        </button>
      </div>
      {error && <p className="ai-error">{error}</p>}
      {rounds.length > 0 && (
        <div className="feihua-rounds">
          {rounds.map((r, i) => (
            <div key={i} className="feihua-round">
              <div className="feihua-char">「{r.char}」</div>
              <div className="feihua-answer">{r.answer}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
