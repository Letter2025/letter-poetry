// [LETTER-POETRY-PLAN-015] 会话自检（登录页 / 探针可用）
import { env } from "cloudflare:workers";
import { hasSession, type AuthEnv } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const ok = await hasSession(request.headers.get("cookie"), env as unknown as AuthEnv);
  return Response.json({ ok }, { headers: { "Cache-Control": "no-store" } });
}