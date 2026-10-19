# LETTER-POETRY-PLAN-015 · 访问密钥门（与其他 Letter 站点同构）

| 项 | 值 |
|---|---|
| 状态 | ✅ 已上线（2026-10-19） |
| 关联 | [PLAN-014](LETTER-POETRY-PLAN-014-D1行读配额治理-随机与每日改静态id.md)（D1 行读配额治理）；`letter-novel/src/auth.ts`（同构实现） |
| 目标 | 给 poetry.myletter.top 加与 Letter Novel 一致的「访问密钥 + session cookie」门：挡住站外突发抓取，同时不影响已登录读者 |

## 1 背景

- 2026-10-18 16:13（CST）诗词站被站外脚本刷 `/api/poem/random`（约 470 次/分钟），单分钟 941 次读查询 / 33,570,861 行，击穿账号级 D1 行读免费额度（5,000,000/天），连带同账号的 `letter-novel-db` 被限流，小说 App 读不了章节。
- PLAN-014 已把「随机/每日一诗」改成静态 id 池 + 主键直查（1 行读/次）+ 短边缘缓存，把放大器关掉；本次再补一层「人不在场就别进来」的门，与其它 Letter 站点保持一致（用户 m04360 要求）。

## 2 设计

- 机制沿用 `letter-novel/src/auth.ts`：**访问密钥 + 30 天 session cookie**；session 落 D1（`app_sessions`），每次校验 1 行读。
- 公开路径（不需要密钥）：`/login`、`/api/auth/login|check|logout`、`/robots.txt`、`/favicon.ico`、`/icon.svg`、`/apple-icon.png`、`/manifest.webmanifest`、`/_next/*`、`/assets/*`、`/og/*`；其余全部受保护。
- 未登录分流：页面 `302 /login?next=<原路径>`（`Cache-Control: no-store`）；`/api/*` 返回 `401 {"ok":false,"error":"unauthorized"}`（避免前端把登录页 HTML 当 JSON 解析）。
- **鉴权必须在页面边缘缓存之前**：`worker/index.ts` 的 Cache API 命中会把整页 HTML 直接返回，若先查缓存等于口令失效（页面 TTL 1 天）。
- fail closed：`ACCESS_KEY` 未配置或为空时一律拒绝登录，绝不「无密钥即放行」。

## 3 实现

| 文件 | 作用 |
|---|---|
| `lib/auth.ts` | `COOKIE_NAME="lp_token"`、`SESSION_DAYS=30`、`SESSION_TABLE="app_sessions"`；`isPublicPath` / `sanitizeNext` / `parseCookies` / `readSessionToken`（16~128 字符）/ `ensureSessionTable`（`CREATE TABLE IF NOT EXISTS` 兜底）/ `hasSession` / `constantTimeEqual` / `loginWithKey`（定长比较 + 32 字节随机 token）/ `logoutSession` / `sessionCookie` / `clearCookie` |
| `app/api/auth/login/route.ts` | POST `{key}` → 校验 → `Set-Cookie: lp_token=…; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=…`；`no-store`；非法密钥 401 |
| `app/api/auth/check/route.ts` | GET 返回 `{ok}`（`no-store`） |
| `app/api/auth/logout/route.ts` | POST 删除 session + 清 cookie |
| `app/login/route.ts` | 手写登录页（`no-store` + `x-robots-tag: noindex`），前端再校验一次 `next`（挡 `//evil.com`） |
| `worker/index.ts` | `fetch` 开头：`!isPublicPath(pathname)` → `hasSession(cookie)` → 未通过走 `unauthorized()`（页面 302 / API 401），之后才进页面缓存分支 |
| `seed/0003_sessions.sql` | `app_sessions(token PK, created_at, expires_at)` + `idx_app_sessions_expires` |
| `tests/auth-gate-guards.test.mjs` | 8 项静态守卫：鉴权早于缓存、登录页不入页面缓存、公开路径清单、next 白名单、fail closed + 定长比较、cookie 属性、D1 建表兜底、登录接口 no-store/401/noindex |

## 4 验证（2026-10-19，线上 poetry.myletter.top）

| 用例 | 结果 |
|---|---|
| 未登录 `GET /` | `302 Found` → `/login?next=%2F`，`Cache-Control: no-store` |
| 未登录 `GET /poem/quantangshi-15086` | `302` → `/login?next=%2Fpoem%2Fquantangshi-15086` |
| 未登录 `GET /api/poems?size=1` | `401`，`Content-Type: application/json`，`no-store` |
| `GET /login` | `200`，`text/html`，`Cache-Control: no-store`，`x-robots-tag: noindex` |
| `POST /api/auth/login` 错误密钥 | `401` |
| `POST /api/auth/login` 正确密钥 | `200 {"ok":true}` + `Set-Cookie` |
| 带 cookie `GET /` | `200` |
| 带 cookie `GET /api/auth/check` | `200 {"ok":true}` |

- 构建/测试：`npm test` **19 项全过**（新增 8 项）；`npm run build` 成功，路由表含 `λ /login` 与 `λ /api/auth/{login,check,logout}`。
- 部署：`wrangler deploy --config dist/server/wrangler.json --name letter-poetry` → Worker Version `097fcc11-1bde-456f-b13f-e4ee89e6cda2`；`wrangler secret put ACCESS_KEY` 先于部署执行。

## 5 运维（密钥轮换 / 踢人）

1. 轮换密钥（旧 session 不失效，直到 30 天过期）：
   `npx wrangler secret put ACCESS_KEY --config dist/server/wrangler.json --name letter-poetry`（提示后输入新密钥）。
2. 立即踢掉所有已登录设备：
   `npx wrangler d1 execute letter-poetry-db --remote --command "DELETE FROM app_sessions"`。
3. 密钥值只存运维密码管理器与 Worker Secret，**任何文档/代码/构建产物都不写明文**。

## 6 影响与残留风险

- `/sitemap*` 与诗详情页对爬虫不再可读 —— SEO 收录会自然衰减；若日后要恢复公开+防刷，改用 Cloudflare Access（Bypass 放行 sitemap/robots）而不是拆掉这道门。
- `letter-status` 的 poetry 监控项 `followRedirect: true`：`/` → 302 → `/login` → 200，仍判 operational；代价是只验证「登录页可达」，不再能反映诗词页本身的可用性。
- 客户端行为：浏览器首次访问落在登录页，登录后 30 天内免登录；`curl`/脚本一律 401/302。
- 未加登录失败速率限制（可后续在 Worker 里按 IP 计数，或交给 Cloudflare Rate Limiting）。

## 7 变更记录

- 2026-10-19：新增访问密钥门（`lib/auth.ts`、`app/login/route.ts`、`app/api/auth/*`、`worker/index.ts` 缓存前鉴权、`seed/0003_sessions.sql`、`tests/auth-gate-guards.test.mjs`）；线上 302/401/200 三段核验通过；Worker Version `097fcc11-1bde-456f-b13f-e4ee89e6cda2`。
