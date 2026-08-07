// [LETTER-POETRY-PLAN-010#2] AI 解析/问答代理：服务端转发智谱 OpenAI 兼容接口
// Key 只存 Cloudflare Secret（env.ZHIPU_API_KEY），绝不进 git / 前端 / bundle
import { env } from "cloudflare:workers";
import { getPoemRow } from "@/lib/db";

export const dynamic = "force-dynamic";

const ZHIPU_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const MODEL = "glm-4.7-flash";
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

  const key = env.ZHIPU_API_KEY;
  if (!key) return json({ error: "AI 未配置（缺少 ZHIPU_API_KEY）" }, 503);

  const system = mode === "explain" ? SYSTEM_EXPLAIN : SYSTEM_ASK;
  const user =
    mode === "ask"
      ? `以下是诗文：\n${text}\n\n用户问题：${question}`
      : `诗文：\n${text}`;

  try {
    const upstream = await fetch(ZHIPU_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 1024,
        temperature: 0.7,
        // [LETTER-POETRY-PLAN-010] glm-4.7-flash 默认思考模式会耗尽 max_tokens 导致 content 为空，必须禁用
        thinking: { type: "disabled" },
      }),
    });

    if (!upstream.ok) {
      const detail = (await upstream.text().catch(() => "")).slice(0, 200);
      return json({ error: `AI 服务异常（${upstream.status}）`, detail }, 502);
    }

    const data = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content) return json({ error: "AI 返回为空" }, 502);
    return json({ content }, 200);
  } catch (e) {
    return json({ error: "AI 请求失败", detail: String(e).slice(0, 200) }, 502);
  }
}