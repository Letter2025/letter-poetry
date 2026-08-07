# Letter Poetry · 古典诗文档案

> 可检索、可细读、可收藏的在线诗文集 —— 唐诗宋词、诗经楚辞、元曲与蒙学经典，一处安放。

**线上地址：** https://poetry.myletter.top · **Letter Network 成员站** · **GitHub：** https://github.com/Letter2025/letter-poetry
**图标：** https://poetry.myletter.top/favicon-64.png

## 项目立项（Why）

古典诗文是共同的文化遗产，但多数在线合集杂乱、广告多、难以检索。本档案围绕「文本本身」重建阅读体验：干净的排版、全文检索、注释与白话译文、每篇独立的稳定 URL——所有数据在构建时打包，运行时零外部 API，快而稳定。它是这封「Letter」的文学翼。

## 寓意（What “Letter” Means）

Letter 是统一个人品牌，也是这套知识资产的集合名词。诗歌是最古老的「信」——写下来、跨越千年仍可被阅读的文字。本站让这些文字保持可读、可检索与优美。

## 功能特性

- **每日一诗与随机** —— 每天一首，一键随机阅读。
- **13 部选集** —— 唐诗三百首（~320）、千家诗（~220）、宋词三百首（280）、诗经（305）、楚辞（65）、元曲（精选 1200）、花间集（~500）、南唐二主词（45）、纳兰性德（~260）、曹操诗集（26）、水墨唐诗（176）、幽梦影（219）、蒙学（231）。
- **全文检索** —— 按标题 / 作者 / 诗句，自动进入全文检索。
- **详情页** —— 正文、注释、白话译文、上一篇 / 下一篇、复制全文。
- **蒙学长文阅读** —— 三字经、百家姓、千字文、古文观止等。
- **深色模式与响应式** —— 共用 Letter 设计令牌。
- **SEO** —— 每篇独立页面 + sitemap + JSON-LD。

## 技术栈

- **框架：** Next.js 16（App Router）+ vinext，部署为 Cloudflare Worker
- **数据构建：** `scripts/build-data.mjs` 将 [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) 原始 JSON 编译为精简数据
- **转换：** `chinese-conv`（繁转简）
- **运行时：** 零外部 API —— 全部数据随 Worker bundle 打包
- **CI/CD：** GitHub Actions → `cloudflare/wrangler-action@v3`

## 目录结构

```text
app/
  page.tsx          # 首页：每日一诗、随机、选集入口
  poems/            # 诗文列表 + 详情
  poem/  collections/  # 选集浏览
  mengxue/          # 蒙学经典长文阅读
  sitemap.ts  robots.ts  # SEO
  globals.css       # Letter 设计令牌
components/
  daily-poem.tsx  collection-browser.tsx  poem-actions.tsx  chrome.tsx
lib/                # 数据加载 / 检索工具
scripts/
  build-data.mjs    # 从 ../cf-poetry-data 编译数据（缺失时沿用已提交数据）
public/  worker/  build/
.github/workflows/deploy.yml  # CI 部署
```

## 快速开始

### 环境要求

- Node.js 22+

### 安装

```bash
npm install
```

### 构建数据（可选）

```bash
npm run build-data   # 从 ../cf-poetry-data 编译；数据源缺失时沿用已提交数据
```

### 本地开发

```bash
npm run dev
```

### 构建

```bash
npm run build
```

## 部署（Cloudflare Workers）

GitHub Actions（`.github/workflows/deploy.yml`）在 push 到 `main` 时触发：

1. `npm ci` + `npm run build`
2. `wrangler deploy --config dist/server/wrangler.json --name letter-poetry`

手动等价命令：

```bash
npm run build
npx wrangler deploy --config dist/server/wrangler.json --name letter-poetry
```

Secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`。Worker 绑定 **poetry.myletter.top**。

## 配置与环境变量

无需运行时环境变量；全部文本数据构建时打包。

## 数据许可

文本数据来自 [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)（MIT License），文本以原始古籍为准。

## License

本仓库未附带 LICENSE，默认保留所有权利；复用前请联系作者。

## 致谢

- Letter Network 家族成员站，共用设计令牌。
- 诗文数据： [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)（MIT）。
- 基于 [Next.js](https://nextjs.org) 与 [vinext](https://github.com/cloudflare/vinext) 构建。
