"use client";

import { useState } from "react";

type AiPanelProps = {
  poem: { id: string; title: string; author: string; text: string };
};

const MAX_QUESTION = 300;

type AiState = { loading: boolean; text?: string; error?: string };

// [LETTER-POETRY-PLAN-010#3] 详情页 AI 面板：一键解析 + 自由询问（客户端，走 /api/ai 服务端代理）
export function AiPanel({ poem }: AiPanelProps) {
  const [explain, setExplain] = useState<AiState>({ loading: false });
  const [ask, setAsk] = useState<AiState>({ loading: false });
  const [question, setQuestion] = useState("");

  const call = async (mode: "explain" | "ask", questionText?: string) => {
    const set = mode === "explain" ? setExplain : setAsk;
    set({ loading: true });
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          id: poem.id,
          ...(mode === "ask" ? { question: questionText } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; content?: string };
      if (!res.ok) {
        set({ loading: false, error: data.error ?? `请求失败（${res.status}）` });
        return;
      }
      set({ loading: false, text: data.content ?? "" });
    } catch {
      set({ loading: false, error: "网络异常，请稍后重试" });
    }
  };

  const askNow = () => {
    const q = question.trim();
    if (!q || q.length > MAX_QUESTION || ask.loading) return;
    call("ask", q);
  };

  return (
    <section className="ai-panel">
      <div className="ai-panel-head">
        <span className="eyebrow"><span className="blue">{"//"}</span> AI 研读</span>
        <span className="ai-hint">由智谱 GLM 生成 · 仅供参考</span>
      </div>

      <div className="ai-block">
        <button className="button" onClick={() => call("explain")} disabled={explain.loading}>
          {explain.loading ? "解析中…" : explain.text ? "重新解析 ↻" : "AI 解析这首诗"}
        </button>
        {explain.error && <p className="ai-error">{explain.error}</p>}
        {explain.text && (
          <div className="ai-output" role="status">{explain.text}</div>
        )}
      </div>

      <div className="ai-block ai-ask">
        <div className="ai-ask-row">
          <input
            className="ai-input"
            value={question}
            maxLength={MAX_QUESTION}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              // IME 组合输入的回车不提交
              if (e.key === "Enter" && !e.nativeEvent.isComposing) askNow();
            }}
            placeholder={`就《${poem.title}》提问（≤${MAX_QUESTION} 字）`}
            aria-label="向 AI 询问"
          />
          <button className="button dark" onClick={askNow} disabled={ask.loading || !question.trim()}>
            {ask.loading ? "思考中…" : "询问"}
          </button>
        </div>
        {question.trim().length > MAX_QUESTION && (
          <p className="ai-error">问题最多 {MAX_QUESTION} 字</p>
        )}
        {ask.error && <p className="ai-error">{ask.error}</p>}
        {ask.text && <div className="ai-output" role="status">{ask.text}</div>}
      </div>
    </section>
  );
}