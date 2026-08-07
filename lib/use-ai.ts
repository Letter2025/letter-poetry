"use client";

// [LETTER-POETRY-PLAN-012#2] 客户端统一 AI 调用（走 /api/ai 三级回退链，返回纯文本 + provider）
export type AiMode = "explain" | "ask" | "sign" | "create" | "feihua" | "quiz" | "quick";

export type CallAiBody = {
  mode: AiMode;
  id?: string;
  text?: string;
  question?: string;
  extra?: string;
};

export type AiResult = { content: string; provider: string };

export async function callAi(body: CallAiBody): Promise<AiResult> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    content?: string;
    provider?: string;
  };
  if (!res.ok) throw new Error(data.error ?? `请求失败（${res.status}）`);
  if (!data.content) throw new Error("AI 返回为空");
  return { content: data.content, provider: data.provider ?? "" };
}
