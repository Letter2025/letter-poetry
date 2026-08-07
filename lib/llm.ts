// [LETTER-POETRY-PLAN-011#2] 三级回退链：智谱 GLM → SiliconFlow 免费对话模型 → Cloudflare Workers AI 兜底
// 移植自 letter-ask src/rag.ts（generateOnce 非流式部分）；模型池按序尝试 + 指数退避重试 + Provider 逐级回退
// Key 只存 Worker secret（ZHIPU_API_KEY / SILICONFLOW_API_KEY），绝不进 git / 前端 / bundle
import { env } from "cloudflare:workers";

const MAX_RETRY = 2; // 单模型失败重试次数（指数退避）

const ZHIPU_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const ZHIPU_MODELS = ["glm-4.7-flash", "glm-4-flash-250414"];

const SILICONFLOW_URL = "https://api.siliconflow.cn/v1/chat/completions";
const SILICONFLOW_MODELS = ["THUDM/GLM-Z1-9B-0414", "tencent/Hunyuan-MT-7B"];

const WORKERS_AI_MODEL = "@cf/openai/gpt-oss-20b";

export type LlmResult = { content: string; provider: string };
type GenerateOpts = { system: string; user: string };

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/* ============ ① 智谱官方 GLM（主力，免费；多模型轮询） ============ */
async function zhipuGenerate(opts: GenerateOpts): Promise<LlmResult> {
  let lastErr: unknown = new Error("zhipu: no models configured");
  for (const model of ZHIPU_MODELS) {
    for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
      try {
        const res = await fetch(ZHIPU_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${env.ZHIPU_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            thinking: { type: "disabled" }, // 关闭思考：快速输出正文、节省 token
            max_tokens: 4096,
            messages: [
              { role: "system", content: opts.system },
              { role: "user", content: opts.user },
            ],
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: { code?: string | number; message?: string };
          choices?: { message?: { content?: string } }[];
        };
        if (data?.error) throw new Error(`zhipu ${data.error.code}: ${data.error.message}`);
        if (!res.ok) throw new Error(`zhipu http ${res.status}`);
        const content = (data.choices?.[0]?.message?.content ?? "").trim();
        if (!content) throw new Error("zhipu empty response");
        return { content, provider: `zhipu:${model}` };
      } catch (e) {
        lastErr = e;
        if (attempt < MAX_RETRY) await sleep(300 * Math.pow(2, attempt));
      }
    }
  }
  throw lastErr;
}

/* ============ ② SiliconFlow 免费对话模型（并发补充；需实名+余额解锁，key 缺失自动跳过） ============ */
async function siliconflowGenerate(opts: GenerateOpts): Promise<LlmResult> {
  if (!env.SILICONFLOW_API_KEY) throw new Error("siliconflow: no api key");
  let lastErr: unknown = new Error("siliconflow: no models configured");
  for (const model of SILICONFLOW_MODELS) {
    for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
      try {
        const res = await fetch(SILICONFLOW_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${env.SILICONFLOW_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: 4096, // GLM-Z1 思考型：推理内容计入 max_tokens，需给足否则正文截断
            messages: [
              { role: "system", content: opts.system },
              { role: "user", content: opts.user },
            ],
          }),
        });
        if (!res.ok) {
          const text = (await res.text().catch(() => "")).slice(0, 200);
          throw new Error(`siliconflow http ${res.status}: ${text}`);
        }
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = (data.choices?.[0]?.message?.content ?? "").trim();
        if (!content) throw new Error("siliconflow empty response");
        return { content, provider: `siliconflow:${model}` };
      } catch (e) {
        lastErr = e;
        if (attempt < MAX_RETRY) await sleep(300 * Math.pow(2, attempt));
      }
    }
  }
  throw lastErr;
}

/* ============ ③ Cloudflare Workers AI（兜底；免费 10K neurons/天） ============ */
async function workersAiGenerate(opts: GenerateOpts): Promise<LlmResult> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
    try {
      const res = (await env.AI?.run(WORKERS_AI_MODEL, {
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
        max_tokens: 4096,
      })) as
        | { response?: string; choices?: { message?: { content?: string } }[] }
        | undefined;
      // gpt-oss-20b 返回 OpenAI 兼容格式 choices[0].message.content；原生 Workers AI 模型返回 response
      const content = (res?.choices?.[0]?.message?.content ?? res?.response ?? "").trim();
      if (!content) throw new Error("workers-ai empty response");
      return { content, provider: `workers-ai:${WORKERS_AI_MODEL}` };
    } catch (e) {
      lastErr = e;
      if (attempt < MAX_RETRY) await sleep(300 * Math.pow(2, attempt));
    }
  }
  throw lastErr;
}

/* ============ 统一入口：智谱 → SiliconFlow → Workers AI 三级回退 ============ */
export async function generateWithFallback(opts: GenerateOpts): Promise<LlmResult> {
  try {
    return await zhipuGenerate(opts);
  } catch (e) {
    console.error("[llm] zhipu failed -> siliconflow:", e instanceof Error ? e.message : String(e));
  }
  if (env.SILICONFLOW_API_KEY) {
    try {
      return await siliconflowGenerate(opts);
    } catch (e) {
      console.error("[llm] siliconflow failed -> workers-ai:", e instanceof Error ? e.message : String(e));
    }
  }
  return workersAiGenerate(opts);
}
