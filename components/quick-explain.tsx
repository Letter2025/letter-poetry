"use client";

import { useState } from "react";
import { callAi } from "@/lib/use-ai";

// [LETTER-POETRY-PLAN-012#3] 贴句速解：贴任意一句诗 → AI 一句话解读（不查库，走 /api/ai text 模式）
export function QuickExplain() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ text?: string; error?: string }>({});

  const run = async () => {
    const q = text.trim();
    if (!q || q.length > 200 || busy) return;
    setBusy(true);
    setOut({});
    try {
      const r = await callAi({ mode: "quick", text: q });
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
        <span className="eyebrow"><span className="blue">{"//"}</span> 贴句速解</span>
        <span className="ai-hint">贴任意一句诗 · AI 一句话解读</span>
      </div>
      <div className="ai-ask-row">
        <input
          className="ai-input"
          value={text}
          maxLength={200}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) run();
          }}
          placeholder="如：床前明月光，疑是地上霜。"
          aria-label="粘贴诗句"
        />
        <button className="button dark" onClick={run} disabled={busy || !text.trim()}>
          {busy ? "解读中…" : "解读"}
        </button>
      </div>
      {text.trim().length > 200 && <p className="ai-error">最多 200 字</p>}
      {out.error && <p className="ai-error">{out.error}</p>}
      {out.text && <div className="ai-output">{out.text}</div>}
    </div>
  );
}
