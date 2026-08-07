"use client";

import { useState } from "react";
import { callAi } from "@/lib/use-ai";

const QUESTIONS = [
  { q: "读到边塞诗，你更想看什么？", options: ["大漠孤烟的苍茫", "戍卒思乡的苦楚", "建功立业的豪情"] },
  { q: "若去隐居，你更向往？", options: ["采菊东篱下的悠然", "山中一夜雨的清寂", "还是留在市井烟火里"] },
  { q: "月亮对你意味着？", options: ["思乡的信物", "清冷的孤独", "宇宙的辽阔"] },
  { q: "哪句更打动你？", options: ["会当凌绝顶，一览众山小", "劝君更尽一杯酒，西出阳关无故人", "无可奈何花落去，似曾相识燕归来"] },
  { q: "写诗时你更在意？", options: ["气魄与格局", "细腻的情致", "自然的景致"] },
];

// [LETTER-POETRY-PLAN-012#3] 风格自测：5 道单选 → AI 判定偏好 + 推荐诗
export function StyleQuiz() {
  const [answers, setAnswers] = useState<(number | null)[]>(QUESTIONS.map(() => null));
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ text?: string; error?: string }>({});

  const allAnswered = answers.every((a) => a !== null);

  const submit = async () => {
    if (busy || !allAnswered) return;
    const lines = QUESTIONS.map((q, i) => `第${i + 1}题（${q.q}）→ 选「${q.options[answers[i]!]}」`);
    setBusy(true);
    setOut({});
    try {
      const r = await callAi({ mode: "quiz", extra: lines.join("\n") });
      setOut({ text: r.content });
    } catch (e) {
      setOut({ error: e instanceof Error ? e.message : "生成失败，请稍后重试" });
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setAnswers(QUESTIONS.map(() => null));
    setOut({});
  };

  return (
    <div className="ai-panel">
      <div className="ai-panel-head">
        <span className="eyebrow"><span className="blue">{"//"}</span> 诗词风格自测</span>
        <span className="ai-hint">5 道小题 · AI 判定你的风格偏好</span>
      </div>
      {QUESTIONS.map((q, i) => (
        <div key={i} className="quiz-question">
          <div className="quiz-q">{i + 1}. {q.q}</div>
          <div className="quiz-options">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                className={`quiz-option ${answers[i] === oi ? "active" : ""}`}
                onClick={() => setAnswers((prev) => prev.map((v, vi) => (vi === i ? oi : v)))}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="ai-ask-row" style={{ marginTop: 18 }}>
        <button className="button dark" onClick={submit} disabled={busy || !allAnswered}>
          {busy ? "判定中…" : "判定我的风格"}
        </button>
        {out.text && <button className="button" onClick={reset}>重新作答</button>}
      </div>
      {out.error && <p className="ai-error">{out.error}</p>}
      {out.text && <div className="ai-output">{out.text}</div>}
    </div>
  );
}
