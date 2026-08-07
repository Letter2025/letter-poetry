// [LETTER-POETRY-PLAN-010#2][LETTER-POETRY-PLAN-011#2] AI 解析/问答代理
// 服务端转发三级回退链（lib/llm.ts：智谱 → SiliconFlow → Workers AI）；Key 只存 Worker secret
import { getPoemRow } from "@/lib/db";
import { generateWithFallback } from "@/lib/llm";

export const dynamic = "force-dynamic";

const MAX_QUESTION = 300;
const MAX_TEXT = 2000;

const SYSTEM_EXPLAIN = `你是资深中国古典诗词鉴赏专家。请用简体中文、以清晰分段输出对以下诗文的解析，依次包含：
【背景】创作背景与作者简介（简洁）；
【逐句释义】逐句白话翻译，每句一行；
【赏析】艺术手法与思想情感赏析；
【名句】若存在广为流传的名句，列出并说明其含义；没有则省略该段。
总字数控制在 500 字以内，语言平实准确，不编造史实。`;

const SYSTEM_ASK = `你是中国古典诗词问答助手。请结合用户提供的诗文，用简体中文准确、有条理地回答用户的问题。若问题超出诗文范围（如作者其他作品、历史背景），可结合常识简要回答；不确定的内容请如实说明，不要编造。回答控制在 400 字以内。`;

type AiBody = { id?: string; text?: string; question?: string; mode?: string };

function json(data: unknown, status: number) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request) {
  let body: AiBody;
  try {
    body = (await req.json()) as AiBody;
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const mode = body.mode === "ask" ? "ask" : body.mode === "explain" ? "explain" : null;
  if (!mode) return json({ error: "mode must be explain|ask" }, 400);

  const question = (body.question ?? "").trim();
  if (mode === "ask" && !question) return json({ error: "question required" }, 400);
  if (question.length > MAX_QUESTION) {
    return json({ error: `question too long (max ${MAX_QUESTION})` }, 400);
  }

  // 有 id 时以库内文本为准（详情页），否则用调用方传入的 text
  let text = "";
  if (body.id) {
    const row = await getPoemRow(body.id);
    if (!row) return json({ error: "poem not found" }, 404);
    text = row.text;
  } else if (body.text) {
    text = body.text.trim();
  }
  if (!text) return json({ error: "poem text required" }, 400);
  if (text.length > MAX_TEXT) text = text.slice(0, MAX_TEXT) + "（长诗节选）";

  const system = mode === "explain" ? SYSTEM_EXPLAIN : SYSTEM_ASK;
  const user =
    mode === "ask"
      ? `以下是诗文：\n${text}\n\n用户问题：${question}`
      : `诗文：\n${text}`;

  try {
    const { content, provider } = await generateWithFallback({ system, user });
    return json({ content, provider }, 200);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return json({ error: "AI 生成失败（所有 Provider 均不可用）", detail: detail.slice(0, 200) }, 502);
  }
}
