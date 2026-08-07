"use client";

import { useState } from "react";
import { callAi } from "@/lib/use-ai";

// [LETTER-POETRY-PLAN-012#3] 今日诗签：结合当前月份/季节，生成「为什么今天推荐这首」推荐语（联动 PLAN-009 季节策展）
function seasonLabel(m: number): string {
  if (m >= 3 && m <= 5) return "春季";
  if (m >= 6 && m <= 8) return "夏季";
  if (m >= 9 && m <= 11) return "秋季";
  return "冬季";
}

export function SignCard({ poem }: { poem: { id: string; title: string; text: string } }) {
  const [busy, setBusy] = useState(false);
  const [sign, setSign] = useState<{ text?: string; error?: string }>({});

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    setSign({});
    try {
      const month = new Date().getMonth() + 1;
      const extra = `${month}月·${seasonLabel(month)}`;
      const r = await callAi({ mode: "sign", text: poem.text, extra });
      setSign({ text: r.content });
    } catch (e) {
      setSign({ error: e instanceof Error ? e.message : "生成失败，请稍后重试" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sign-card">
      <button className="button" onClick={generate} disabled={busy}>
        {busy ? "生成中…" : sign.text ? "换一句推荐 ↻" : "AI 今日推荐语 ✦"}
      </button>
      {sign.error && <p className="ai-error">{sign.error}</p>}
      {sign.text && <p className="sign-text">「{sign.text}」</p>}
    </div>
  );
}
