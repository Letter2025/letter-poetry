// [LETTER-POETRY-PLAN-015] 退出：删 session + 清 cookie
import { env } from "cloudflare:workers";
import { clearCookie, logoutSession, readSessionToken, type AuthEnv } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const token = readSessionToken(request.headers.get("cookie"));
  await logoutSession(token, env as unknown as AuthEnv);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store", "Set-Cookie": clearCookie() } });
}