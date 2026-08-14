# AGENTS.md — letter-poetry（古典诗文档案）

## 项目概览

可检索、可细读、可收藏的在线诗文集（https://poetry.myletter.top）：**全唐诗（一期 44 卷 44,020 首）+ 12 部选集 + 独立蒙学模块**，总量 47,000+ 篇。**架构：数据存 Cloudflare D1，服务端检索**；浏览器不再下载全库 JSON。

## 目录结构

| 目录/文件 | 职责 |
|---|---|
| `app/page.tsx` | 首页：选集、统计、每日一诗 |
| `app/poems/` | 检索与列表（`/api/poems` 服务端分页） |
| `app/poem/` `app/collections/` | 详情（D1 动态渲染）与选集浏览 |
| `app/authors/` | 作者索引（静态）与作者作品页（D1） |
| `app/mengxue/` | 蒙学长文（构建期小数据） |
| `app/favorites/` | 本机收藏（localStorage + API 批量取） |
| `app/api/poems/route.ts` | 列表/检索 API（c/q/author/ids/page/size） |
| `app/api/ai/route.ts` | AI 解析/问答代理（POST，智谱 GLM，Key 在 Secret） |
| `app/feihua/` `app/quiz/` | AI 玩法页：飞花令 / 风格自测 |
| `app/river/` `components/river-scene.tsx` | 诗河三维漫游（three.js 客户端渲染，47,629 首真实诗作化作河灯） |
| `components/ai-panel.tsx` 等 | 详情页 AI 面板 + 5 个 AI 玩法组件（sign-card/quick-explain/ai-create/feihua/style-quiz） |
| `app/api/poem/[id]|daily|random` | 详情 / 每日一诗 / 随机 API |
| `lib/db.ts` | **D1 访问层**（server component / route handler 用 `env.DB`） |
| `lib/poetry.ts` | 构建期小元数据（选集/蒙学/作者） |
| `scripts/build-data.mjs` | 数据编译：全唐诗/选集/蒙学 + D1 seed SQL 分片 + 静态元数据 |
| `seed/` | D1 schema（0001_schema.sql）+ seed_01..08.sql（构建产物） |
| `tests/rendered-html.test.mjs` | 数据/产物冒烟测试（`npm test`） |
| `app/globals.css` | Letter 设计令牌 |
| `.github/workflows/deploy.yml` | CI 部署（build + test + deploy；**不含数据导入**，数据手动导入以避免 D1 写配额风险） |

## 开发规则

### 构建与测试命令

```bash
npm install          # 安装依赖
npm run build-data   # 编译数据（数据源缺失时沿用已提交产物）
npm run dev          # 本地开发
npm run build        # 构建（vinext build；RSC 环境在 workerd 运行，支持 cloudflare:workers）
npm test             # 冒烟测试（node --test tests/*.mjs）
```

### 数据导入（重要）

- D1 免费版 **rows_written 每日 10 万**（含索引，约 2 行/首；FTS5 约 5 行/首 → **不要建 FTS**）。
- 全量 47,629 首 ≈ 9.5 万行写，**单日可完成但无余量**；分片 seed_01..08 每片约 6,000 首。
- 若当日配额不足，分批跨天导入（UTC 00:00 重置）。
- 导入命令见 README「部署」节；**CI 不自动导入**（避免重复部署耗尽配额），数据更新走手动流程。

### 代码 / UI 规范

- **必须复用** `app/globals.css` 设计令牌（基准：`E:\aicode\web\letter-links\app\globals.css`），禁止自创配色。
- 深色模式 `data-theme="dark"`；响应式断点 780px；尊重 `prefers-reduced-motion`；字体 Inter + Noto Sans SC。
- 正文渲染一律走 `components/poem-text.tsx`（繁简 + lang）；不要写死 `lang="zh-Hant"`。
- **服务端数据**：详情/搜索走 `lib/db.ts`（`env.DB`），**不要**把全量诗集 JSON 重新打进 bundle（3MB 压缩上限）。
- 新增数据源/修正数据：改 `scripts/build-data.mjs` → `npm run build-data` → 导入 D1（注意配额）→ 更新 seed 产物与 collections-meta。

### OG 分享卡片图

- `app/og/[id]/route.tsx`：satori（JSX→SVG）+ @resvg/resvg-wasm（静态 wasm 导入→PNG）动态渲染每首诗卡片；详情页 og:image 指向 `/og/{id}`。
- 字体：Noto Sans SC ttf（satori 不支持 woff2）运行时加载 + 模块缓存。
- 记住：Workers 禁止动态编译 WASM，resvg 必须 `?module` 静态导入；不要用 @vercel/og（其 resvg 运行时加载 wasm 在 Workers 失效）。

### 策展（主题/季节）

- `lib/generated/themes.json` + `public/data/themes.json`：4 季节 + 6 主题（67 篇精选，静态提交）；`scripts/build-themes.mjs` 连 D1 按标题+作者匹配真实 id 重新生成。
- 页面：`/themes` 总览、`/themes/[slug]`（按 ids 查 D1）、首页 `SeasonPick` 当季推荐（客户端按月选季节）。
- 精选只取库内诗（无宋诗/全宋词）；新增策展改 themes.json + 脚本重跑。

### 拼音注音

- `components/annotated.tsx`（AnnotatedText）：全文注音模式（ruby/rt）+ 悬停 title 拼音 + 点击发声（SpeechSynthesis）；pinyin-pro 即时算（字符与拼音 1:1），繁简兼容。详情页/蒙学正文使用。
- 零数据库改动；多音字按现代读音（古诗破读需小规则覆盖，可选）。

### TTS 朗读

- `components/tts-control.tsx`：浏览器 SpeechSynthesis（中文语音、语速、分段 ≤200 字）；详情页/每日一诗（compact）/蒙学接入。
- 客户端渲染（SSR 返回 null），curl 验证不到；验证用 esbuild 编译 + mock window/speechSynthesis。

### AI 研读（三级回退链）

- `lib/llm.ts`：`generateWithFallback({system,user})` 三级回退链 —— ① 智谱模型池 `glm-4.7-flash,glm-4-flash-250414`（thinking disabled）→ ② SiliconFlow `THUDM/GLM-Z1-9B-0414,tencent/Hunyuan-MT-7B`（需 `SILICONFLOW_API_KEY`，缺 key 自动跳过）→ ③ Cloudflare Workers AI `@cf/openai/gpt-oss-20b` 兜底；每模型指数退避重试 ≤2 次。
- `app/api/ai/route.ts`：`POST /api/ai` 服务端代理，`mode` 支持 7 种：`explain|ask`（详情页解析/询问）、`sign`（今日诗签）、`create`（藏头/命题作诗）、`feihua`（飞花令）、`quiz`（风格自测）、`quick`（贴句速解）；有 `id` 时从 D1 取诗文；输入限制 question ≤300 / extra ≤500 / text ≤2000（quick 200）；返回 `{ content, provider }`。
- 客户端统一调用 `lib/use-ai.ts` 的 `callAi({ mode, id?, text?, question?, extra? })`；各玩法组件见 `components/`。
- **Key 只存 Cloudflare Secret**（`ZHIPU_API_KEY` / `SILICONFLOW_API_KEY`，用 `wrangler secret bulk` 设置避免管道换行），代码只读 env，绝不写死 / 进 git / 前端。
- Workers AI binding：`vite.config.ts` 加 `ai: { binding: "AI" }`（免费 10K neurons/天，仅兜底）。
- `components/ai-panel.tsx`：详情页 AI 面板（解析 + 询问），客户端渲染（curl 验证不到）；结果 `white-space: pre-line` 纯文本渲染（无 markdown）。
- route `force-dynamic` + `Cache-Control: no-store`：AI 响应含用户输入，**不进 CDN 缓存**。
- 每次调用为独立请求（无会话状态）；所有 Provider 失败时返回 502 友好错误。

### 搜索

- `lib/db.ts` searchPoems：相关性排序（标题前缀>标题>作者>正文）+ `hit` 命中行（text 命中返回前 2 行）。
- 前端 `components/highlight.tsx`：`<mark>` 高亮（split/join 安全）。
- 判断线上新旧代码用 workers.dev 直连（主域名可能命中 CDN 缓存）；客户端渲染内容 curl 看不到。

### sitemap

- `/sitemap.xml`：sitemap index → `/sitemap-static.xml`（精选）+ `/sitemap/1..N`（详情分页，D1 每页 10,000 条）。
- 数据量 47,629 → 5 页；改动后旧 `/sitemap.xml` 可能被 CDN 缓存约 1 天（token 无 purge 权限）。

### 缓存策略（CDN 边缘缓存，Cache API）

- Cloudflare **默认不缓存 Worker 响应**，需用 **Cache API**（`caches.default`）显式缓存页面。
- `worker/index.ts`：仅缓存**页面 HTML**（`/`、`/poem/*`、`/collections/*`、`/authors*`、`/mengxue*`、`/poems`、`/favorites`）且**非 RSC 请求**（Accept 不含 `text/x-component`），TTL 1 天；命中后不进 Worker、不查 D1（线上 `CF-Cache-Status: HIT` 已验证）。
- API（`/api/*`）由 route handler 自控：列表/搜索/详情/每日 `no-store`，随机 `no-store`。
- **不要用 KV 做页面缓存**：KV 免费写 1000/天，无法预热 4.7 万首。
- 数据导入后旧缓存最长保留 1 天（TTL 自动过期）；如需立即生效可 purge。

### 部署流程

1. 手动完成数据导入（见上）。
2. push 到 `main` → GitHub Actions：`npm ci` + `npm run build` + `npm test` + `wrangler deploy --config dist/server/wrangler.json --name letter-poetry`。
3. 域名 poetry.myletter.top 的 DNS/路由在 Cloudflare 面板配置；D1 binding（`DB`）在 `vite.config.ts`，部署配置自动生成到 `dist/server/wrangler.json`。

### 计划驱动开发

- 功能开发 / 重构前，先在 `docs/` 创建 `{PROJECT}-PLAN-XXX-功能名称.md`（中文命名、编号递增）。
- 代码注释标注：`[LETTER-POETRY-PLAN-编号#段号.子段号]`。
- 收尾：状态 `✅ 全部完成`；同步更新本文件目录结构；`.learnings/LEARNINGS.md` 记录。

### 协作注意事项

- README 三语言必须带语言切换条（顶部 `<!-- README-LANGUAGES: ... -->` 标记 + 链接行，各语言互相可跳转），约定见网络开放规范 `LETTER-NETWORK-开放规范.md` §3.2；部署工作流须 `paths-ignore: README*.md` 忽略 README-only 变更。
- 与用户交流使用中文；提交信息遵循 Conventional Commits。
- git remote 名以 `git remote -v` 为准；remote 不保留带 token 的 URL；推送使用显式 cwd。
- 引用 chinese-poetry 数据时保留 MIT 出处。
- 任务完成后在 `.learnings/` 记录要点。