// [LETTER-POETRY-PLAN-010#2][LETTER-POETRY-PLAN-011#2][LETTER-POETRY-PLAN-012#2]
// AI 代理：详情页解析/询问 + 首页/策展/独立页 5 个 AI 玩法；三级回退链（lib/llm.ts），Key 只存 Worker secret
import { getPoemRow } from "@/lib/db";
import { generateWithFallback } from "@/lib/llm";

export const dynamic = "force-dynamic";

const MAX_TEXT = 2000;
const MAX_QUESTION = 300;
const MAX_EXTRA = 500;

const SYSTEM_EXPLAIN = `你是资深中国古典诗词鉴赏专家。请用简体中文、以清晰分段输出对以下诗文的解析，依次包含：
【背景】创作背景与作者简介（简洁）；
【逐句释义】逐句白话翻译，每句一行；
【赏析】艺术手法与思想情感赏析；
【名句】若存在广为流传的名句，列出并说明其含义；没有则省略该段。
总字数控制在 500 字以内，语言平实准确，不编造史实。`;

const SYSTEM_ASK = `你是中国古典诗词问答助手。请结合用户提供的诗文，用简体中文准确、有条理地回答用户的问题。若问题超出诗文范围（如作者其他作品、历史背景），可结合常识简要回答；不确定的内容请如实说明，不要编造。回答控制在 400 字以内。`;

const SYSTEM_SIGN = `你是古典诗词编辑。结合当前季节与月份，为下面这首诗写一句「今日推荐语」：说明为什么今天适合读它（可呼应节气、季节、时令心境）。只输出推荐语本身，60 字以内，亲切自然，不要引用原句以外的大段内容。`;

const SYSTEM_CREATE = `你是古典诗词创作者。根据用户要求即兴创作一首古诗（五言或七言均可），给出题目与正文。若用户给出藏头字，请创作藏头诗（每句首字连读恰好是藏头字）；否则按主题创作。诗句要押韵、有意象、符合古诗格律常识。正文写完后另起一行注明「（AI 创作，仅供娱乐参考）」。`;

const SYSTEM_FEIHUA = `你是飞花令诗库。用户给出一个字，请接 3-5 句包含该字的经典诗句，每句注明作者与篇名（如：李白《静夜思》）。只接真实流传的诗句，不要编造；若确实没有，如实说明。`;

const SYSTEM_QUIZ = `你是诗词鉴赏向导。用户完成了一份简短的性格/审美问卷，请根据其作答判定诗词风格偏好（如豪放、婉约、田园、边塞、隐逸等），简要说明理由，并推荐 2-3 首适合 ta 的诗（给出诗名与作者，尽量选常见诗库内的作品）。`;

const SYSTEM_QUICK = `你是古典诗词速解助手。对用户贴出的诗句用 1-2 句话快速解读：含义 + 出处（作者与篇名，不确定就说「出处不详」）。总字数不超过 80 字，简洁。`;

type AiBody = {
  id?: string;
  text?: string;
  question?: string;
  extra?: string;
  mode?: string;
};

const MODES = ["explain", "ask", "sign", "create", "feihua", "quiz", "quick"] as const;
type Mode = (typeof MODES)[number];

function isMode(v: string | undefined): v is Mode {
  return !!v && (MODES as readonly string[]).includes(v);
}

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

  if (!isMode(body.mode)) {
    return json({ error: `mode must be one of: ${MODES.join("|")}` }, 400);
  }
  const mode = body.mode;

  const question = (body.question ?? "").trim();
  const extra = (body.extra ?? "").trim();

  if (question.length > MAX_QUESTION) return json({ error: `question too long (max ${MAX_QUESTION})` }, 400);
  if (extra.length > MAX_EXTRA) return json({ error: `extra too long (max ${MAX_EXTRA})` }, 400);

  // text：详情页按 id 从 D1 取；其余直接取传入 text
  let text = "";
  if (body.id) {
    const row = await getPoemRow(body.id);
    if (!row) return json({ error: "poem not found" }, 404);
    text = row.text;
  } else if (body.text) {
    text = body.text.trim();
  }

  // mode 级长度限制
  if (mode === "quick" && text.length > 200) return json({ error: "quick text too long (max 200)" }, 400);
  if ((mode === "explain" || mode === "ask" || mode === "sign") && text.length > MAX_TEXT) {
    text = text.slice(0, MAX_TEXT) + "（长诗节选）";
  }
  if (mode === "ask" && !question) return json({ error: "question required" }, 400);
  if ((mode === "create" || mode === "feihua") && !extra) {
    return json({ error: "extra required" }, 400);
  }

  const system = selectSystem(mode);
  const user = buildUser(mode, { text, question, extra });
  if (!user) return json({ error: "insufficient input for mode" }, 400);

  try {
    const { content, provider } = await generateWithFallback({ system, user });
    return json({ content, provider }, 200);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return json({ error: "AI 生成失败（所有 Provider 均不可用）", detail: detail.slice(0, 200) }, 502);
  }
}

function selectSystem(mode: Mode): string {
  switch (mode) {
    case "explain": return SYSTEM_EXPLAIN;
    case "ask": return SYSTEM_ASK;
    case "sign": return SYSTEM_SIGN;
    case "create": return SYSTEM_CREATE;
    case "feihua": return SYSTEM_FEIHUA;
    case "quiz": return SYSTEM_QUIZ;
    case "quick": return SYSTEM_QUICK;
  }
}

function buildUser(mode: Mode, p: { text: string; question: string; extra: string }): string | null {
  switch (mode) {
    case "explain":
      return p.text ? `诗文：\n${p.text}` : null;
    case "ask":
      return p.text && p.question ? `以下是诗文：\n${p.text}\n\n用户问题：${p.question}` : null;
    case "sign":
      return p.text ? `今天是 ${p.extra || "今天"}。今天的诗：\n${p.text}\n\n推荐语：` : null;
    case "create":
      return `创作要求：${p.extra}`;
    case "feihua":
      return `飞花令：请接含「${p.extra}」字的诗句。`;
    case "quiz":
      return `风格自测问卷作答：\n${p.extra}\n\n请判定我的诗词风格偏好并推荐诗。`;
    case "quick":
      return p.text ? `这句诗：${p.text}` : null;
  }
}
