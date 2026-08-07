"use client";

import { useState } from "react";
import { callAi } from "@/lib/use-ai";

// [LETTER-POETRY-PLAN-012#3] AI 藏头诗 / 命题作诗：输入主题或藏头字，AI 即兴创作（标注 AI 生成）
export function AiCreate() {
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ text?: string; error?: string }>({});

  const run = async () => {
    const req = extra.trim();
    if (!req || req.length > 100 || busy) return;
    setBusy(true);
    setOut({});
    try {
      const r = await callAi({ mode: "create", extra: req });
      setOut({ text: r.content });
    } catch (e) {
      setOut({ error: e instanceof Error ? e.message : "生成失败，请稍后重试" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ai-panel">
      <div className="ai-panel-head">
        <span className="eyebrow"><span className="blue">{"//"}</span> AI 藏头诗 / 命题作诗</span>
        <span className="ai-hint">AI 创作 · 仅供娱乐参考</span>
      </div>
      <div className="ai-ask-row">
        <input
          className="ai-input"
          value={extra}
          maxLength={100}
          onChange={(e) => setExtra(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) run();
          }}
          placeholder="输入主题或藏头字，如「夏夜」或「明月清风」"
          aria-label="创作要求"
        />
        <button className="button dark" onClick={run} disabled={busy || !extra.trim()}>
          {busy ? "创作中…" : "作诗"}
        </button>
      </div>
      {out.error && <p className="ai-error">{out.error}</p>}
      {out.text && <div className="ai-output">{out.text}</div>}
    </div>
  );
}
