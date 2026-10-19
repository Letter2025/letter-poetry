// [LETTER-POETRY-PLAN-015] 访问密钥登录：校验密钥 -> 建 session -> 下发 cookie
import { env } from "cloudflare:workers";
import { loginWithKey, sessionCookie, type AuthEnv } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let key = "";
  try {
    const body = (await request.json()) as { key?: unknown };
    key = typeof body?.key === "string" ? body.key : "";
  } catch {
    key = "";
  }
  const result = await loginWithKey(key, env as unknown as AuthEnv);
  if (!result.ok || !result.token || !result.expires) {
    return Response.json({ ok: false, error: "invalid_key" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store", "Set-Cookie": sessionCookie(result.token, result.expires) } }
  );
}