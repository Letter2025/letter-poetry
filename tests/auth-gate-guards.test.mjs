// [LETTER-POETRY-PLAN-015] 访问密钥门的静态守卫：顺序、公开路径、cookie 属性、回跳过滤
import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const read = (rel) => readFileSync(new URL("../" + rel, import.meta.url), "utf8");

test("worker 入口：鉴权必须早于页面缓存，且 API 未登录返回 401", () => {
  const src = read("worker/index.ts");
  const guard = src.indexOf("isPublicPath(url.pathname)");
  const cache = src.indexOf("caches.default");
  assert.ok(guard >= 0, "缺少公开路径判断");
  assert.ok(cache > guard, "鉴权必须早于页面缓存，否则缓存会绕过口令");
  assert.ok(src.includes('pathname.startsWith("/api/")'), "API 未登录要返回 401 而不是 302");
  assert.ok(src.includes("/login?next="), "页面未登录要 302 到登录页并带 next");
});

test("登录页不参与边缘页面缓存", () => {
  const src = read("worker/index.ts");
  const line = src.split("\n").find((l) => l.includes("PAGE_PREFIXES")) || "";
  assert.ok(!line.includes("/login"), "登录页不能被页面缓存命中");
});

test("公开路径包含登录/退出/自检与静态资源，其余受保护", () => {
  const src = read("lib/auth.ts");
  for (const p of ["/login", "/api/auth/login", "/api/auth/check", "/api/auth/logout", "/robots.txt"]) {
    assert.ok(src.includes('"' + p + '"'), "公开路径缺少 " + p);
  }
  assert.ok(src.includes('"/_next/"'), "缺少构建资源前缀 _next");
});

test("回跳只允许站内相对路径（挡 //evil.com 与反斜杠）", () => {
  const src = read("lib/auth.ts");
  assert.ok(src.includes('raw.startsWith("//")') || src.includes('startsWith("//")'), "缺少 // 拦截");
  assert.ok(src.includes("sanitizeNext"), "缺少 sanitizeNext");
  const page = read("app/login/route.ts");
  assert.ok(page.includes('charAt(1) !== "/"'), "登录页前端也要挡 // 协议相对 URL");
});

test("密钥校验：未配置密钥一律拒绝，且用定长比较", () => {
  const src = read("lib/auth.ts");
  assert.ok(src.includes("env.ACCESS_KEY"), "缺少 ACCESS_KEY 读取");
  assert.ok(src.includes("if (!expected || !given"), "未配置密钥时必须拒绝（fail closed）");
  assert.ok(src.includes("constantTimeEqual"), "缺少定长比较");
  assert.ok(src.includes("token.length >= 16 && token.length <= 128"), "session token 长度窗口");
});

test("session cookie 属性：HttpOnly + Secure + SameSite=Lax + Path=/", () => {
  const src = read("lib/auth.ts");
  assert.ok(src.includes("HttpOnly; Secure; SameSite=Lax; Path=/"), "cookie 属性不完整");
  assert.ok(src.includes("Max-Age=0"), "缺少清理 cookie");
});

test("session 落 D1 且有建表兜底", () => {
  const src = read("lib/auth.ts");
  assert.ok(src.includes('SESSION_TABLE = "app_sessions"'), "缺 app_sessions 表名");
  assert.ok(src.includes("CREATE TABLE IF NOT EXISTS"), "缺建表兜底");
  assert.ok(src.includes("DELETE FROM "), "缺退出删除 session");
  const seed = read("seed/0003_sessions.sql");
  assert.ok(seed.includes("CREATE TABLE IF NOT EXISTS app_sessions"), "seed 未登记表结构");
});

test("登录接口：no-store + Set-Cookie + 非法密钥 401；登录页 noindex", () => {
  const api = read("app/api/auth/login/route.ts");
  assert.ok(api.includes("force-dynamic"), "登录接口必须 force-dynamic");
  assert.ok(api.includes("Set-Cookie"), "登录成功要下发 cookie");
  assert.ok(api.includes("no-store"), "登录响应不能缓存");
  assert.ok(api.includes("401"), "非法密钥要 401");
  const page = read("app/login/route.ts");
  assert.ok(page.includes("noindex"), "登录页要 noindex");
  assert.ok(page.includes('fetch("/api/auth/login"'), "登录页要调用登录接口");
  assert.ok(page.includes("cache-control\", \"no-store") || page.includes("no-store"), "登录页不能缓存");
});