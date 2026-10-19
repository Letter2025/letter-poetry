// [LETTER-POETRY-PLAN-015] 访问密钥门：与 letter-novel/src/auth.ts 同构（访问密钥 + 30 天 session cookie）
// 设计：session 落 D1（app_sessions，每次校验 1 行读）；密钥只存 Worker Secret（ACCESS_KEY），绝不出现在代码/构建产物。
export const COOKIE_NAME = "lp_token";
export const SESSION_DAYS = 30;
export const SESSION_TABLE = "app_sessions";

export type D1Like = {
  prepare(sql: string): {
    bind(...args: unknown[]): {
      first<T = Record<string, unknown>>(): Promise<T | null>;
      run(): Promise<unknown>;
    };
  };
};
export type AuthEnv = { DB: D1Like; ACCESS_KEY?: string };

// 公开路径：登录相关 + 静态资源 + 站点地图/爬虫文件（其余一律要密钥）
const PUBLIC_EXACT = [
  "/login",
  "/api/auth/login",
  "/api/auth/check",
  "/api/auth/logout",
  "/robots.txt",
  "/favicon.ico",
  "/icon.svg",
  "/apple-icon.png",
  "/manifest.webmanifest",
];
const PUBLIC_PREFIX = ["/_next/", "/assets/", "/og/"];

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  return PUBLIC_PREFIX.some((p) => pathname.startsWith(p));
}

/** 登录后回跳只允许站内相对路径：挡住 //evil.com、绝对 URL 与反斜杠绕过 */
export function sanitizeNext(raw: string | null | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//")) return "/";
  if (raw.includes("\\")) return "/";
  return raw;
}

export function parseCookies(header: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export function readSessionToken(header: string | null | undefined): string | null {
  const token = parseCookies(header)[COOKIE_NAME] ?? "";
  return token.length >= 16 && token.length <= 128 ? token : null;
}

let tableReady = false;
export async function ensureSessionTable(env: AuthEnv): Promise<void> {
  if (tableReady) return;
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS " + SESSION_TABLE + " (token TEXT PRIMARY KEY, created_at TEXT NOT NULL, expires_at TEXT NOT NULL)"
  ).run();
  tableReady = true;
}

export async function hasSession(header: string | null | undefined, env: AuthEnv): Promise<boolean> {
  const token = readSessionToken(header);
  if (!token) return false;
  try {
    await ensureSessionTable(env);
    const row = await env.DB.prepare("SELECT expires_at FROM " + SESSION_TABLE + " WHERE token = ?1")
      .bind(token)
      .first<{ expires_at: string }>();
    return !!row && new Date(row.expires_at).getTime() > Date.now();
  } catch {
    return false;
  }
}

/** 定长比较（长度不同直接 false，避免按字节早退泄露前缀） */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function loginWithKey(key: string, env: AuthEnv): Promise<{ ok: boolean; token?: string; expires?: string }> {
  const expected = (env.ACCESS_KEY ?? "").trim();
  const given = (key ?? "").trim();
  if (!expected || !given || !constantTimeEqual(given, expected)) return { ok: false };
  await ensureSessionTable(env);
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  const token = Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await env.DB.prepare(
    "INSERT OR REPLACE INTO " + SESSION_TABLE + " (token, created_at, expires_at) VALUES (?1, ?2, ?3)"
  ).bind(token, new Date().toISOString(), expires).run();
  return { ok: true, token, expires };
}

export async function logoutSession(token: string | null, env: AuthEnv): Promise<void> {
  if (!token) return;
  try {
    await ensureSessionTable(env);
    await env.DB.prepare("DELETE FROM " + SESSION_TABLE + " WHERE token = ?1").bind(token).run();
  } catch {
    // 退出失败不影响清 cookie
  }
}

export function sessionCookie(token: string, expires: string): string {
  return COOKIE_NAME + "=" + token + "; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=" + new Date(expires).toUTCString();
}

export function clearCookie(): string {
  return COOKIE_NAME + "=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";
}