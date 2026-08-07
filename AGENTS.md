# AGENTS.md — letter-poetry（古典诗文档案）

## 项目概览

可检索、可细读、可收藏的在线诗文集（https://poetry.myletter.top）：**12 部选集 + 独立蒙学模块**、全文检索、每日一诗、作者索引、繁简切换、本机收藏夹。数据构建时打包，运行时零外部 API。

## 目录结构

| 目录/文件 | 职责 |
|---|---|
| `app/page.tsx` | 首页：每日一诗、随机、选集入口 |
| `app/poems/` | 诗文列表与全文检索（`full.json` 单请求） |
| `app/collections/` `app/poem/` | 选集浏览与详情 |
| `app/authors/` | 作者索引与作者作品页（`authors.json` 驱动） |
| `app/mengxue/` | 蒙学经典长文阅读（古文观止按卷分组） |
| `app/favorites/` | 本机收藏清单（localStorage） |
| `components/daily-poem.tsx` 等 | 首页 / 选集 / 操作组件 |
| `components/poem-text.tsx` `script-toggle.tsx` | 繁简切换与正文渲染（chinese-conv） |
| `components/author-browser.tsx` | 作者索引搜索/分页 |
| `scripts/build-data.mjs` | 数据编译（数据源 `../cf-poetry-data`；产出分选集 JSON、`full.json`、`authors.json`、`rss.xml`） |
| `lib/` | 数据加载与检索、繁简脚本状态 |
| `tests/rendered-html.test.mjs` | 数据与产物冒烟测试（`npm test`） |
| `public/` | 静态资源（图标、`data/`、`manifest.webmanifest`、`rss.xml`） |
| `app/globals.css` | Letter 设计令牌 |
| `worker/` | Cloudflare Worker 入口（vinext） |
| `.github/workflows/deploy.yml` | CI 部署（build + test + deploy） |

## 开发规则

### 构建与测试命令

```bash
npm install          # 安装依赖
npm run build-data   # 重新编译数据（数据源缺失时沿用已提交数据）
npm run dev          # 本地开发
npm run build        # 构建（vinext build）
npm test             # 数据/产物冒烟测试（node --test tests/*.mjs）
```

### 代码 / UI 规范

- **必须复用** `app/globals.css` 设计令牌（基准：`E:\aicode\web\letter-links\app\globals.css`），禁止自创配色。
- 深色模式 `data-theme="dark"`；响应式断点 780px；尊重 `prefers-reduced-motion`；字体 Inter + Noto Sans SC。
- 排版以「可细读」为先：正文、注释、白话译文分层清晰；每篇独立 URL + JSON-LD。
- 新增 / 修正诗文数据：更新数据源或 `scripts/build-data.mjs` 产物，保持繁简转换（chinese-conv）一致。
- 正文渲染一律走 `components/poem-text.tsx`（自动处理繁简与 lang 属性），不要直接写死 `lang="zh-Hant"`。

### 部署流程

1. push 到 `main` → GitHub Actions：`npm ci` + `npm run build` + `npm test`。
2. `wrangler deploy --config dist/server/wrangler.json --name letter-poetry`（secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`）。
3. 域名 poetry.myletter.top 的 DNS/路由在 Cloudflare 面板配置。

### 计划驱动开发

- 功能开发 / 重构前，先在 `docs/` 创建 `{PROJECT}-PLAN-XXX-功能名称.md`（中文命名、编号递增）。
- 代码注释标注：`[LETTER-POETRY-PLAN-编号#段号.子段号]`。
- 计划结构：元信息 / 背景 / 分段方案 / 文件清单 / 实施顺序 / 风险与应对 / 变更记录。
- 收尾：状态 `✅ 全部完成`；同步更新本文件目录结构；`.learnings/LEARNINGS.md` 记录。

### 协作注意事项

- 与用户交流使用中文；提交信息遵循 Conventional Commits。
- git remote 名以 `git remote -v` 为准；remote 不保留带 token 的 URL；推送使用显式 cwd。
- 引用 chinese-poetry 数据时保留 MIT 出处。
- 任务完成后在 `.learnings/` 记录要点。