<!-- README-LANGUAGES: en,zh-CN,zh-TW -->
[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

# Letter Poetry · 古典诗文档案

> 可检索、可细读、可收藏的在线诗文集 —— 唐诗、宋词、诗经、楚辞、元曲与蒙学经典，一处安放。

**线上地址：** https://poetry.myletter.top · **Letter Network 成员站** · **GitHub：** https://github.com/Letter2025/letter-poetry
**图标：** https://poetry.myletter.top/favicon-64.png

## 项目立项（Why）

古典诗文是共同的文化遗产，但多数在线合集杂乱、广告多、难以检索。本档案围绕「文本本身」重建阅读体验：干净的排版、全文检索、注释与白话译文、每篇独立的稳定 URL。数据存储在 Cloudflare D1、由服务端检索，因此即使馆藏远超「静态打包」的容量上限，站点依然保持快速。

## 寓意（What “Letter” Means）

Letter 是统一个人品牌，也是这套知识资产的集合名词。诗歌是最古老的「信」——写下来、跨越千年仍可被阅读的文字。本站让这些文字保持可读、可检索与优美。

## 功能特性

- **每日一诗与随机** —— 每天一首，一键随机阅读。
- **47,000+ 篇目** —— 全唐诗（一期前 44 卷 44,020 首）+ 原 12 部选集（唐诗三百、宋词三百、诗经、楚辞、元曲、花间集、纳兰性德…），后续分批扩录更多卷。
- **服务端检索** —— 按标题 / 作者 / 诗句，经由 `/api/poems`（D1 支撑）检索；浏览器无需下载全库。
- **详情页** —— 正文、注释、白话译文、复制全文、收藏。
- **作者索引** —— 在 `/authors` 浏览 2,390+ 位诗人与文人。
- **繁简切换** —— 阅读正文可随时在简体 / 繁体之间切换。
- **蒙学长文阅读** —— 三字经、古文观止（按卷分组）等。
- **深色模式与响应式** —— 共用 Letter 设计令牌。
- **SEO 与分享** —— 每篇独立页面 + sitemap（选集/作者/蒙学）+ JSON-LD + Open Graph 卡片图 + RSS + PWA Manifest。

## 技术栈

- **框架：** Next.js 16（App Router）+ vinext，部署为 Cloudflare Worker
- **存储：** Cloudflare D1（`poems` 表，仅 id 主键索引，适配免费版每日 10 万行写配额）；选集/作者列表走小型静态文件
- **检索：** D1 上的服务端 SQL `LIKE`（标题/作者/正文），分页 API
- **数据构建：** `scripts/build-data.mjs` 编译 chinese-poetry JSON（chinese-conv 转简），产出 D1 seed SQL 分片 + 小型静态元数据
- **运行时：** 零外部 API —— 全部查询走本站 Worker + D1
- **CI/CD：** GitHub Actions → `cloudflare/wrangler-action@v3`（build + test + deploy）

## 目录结构

```text
app/
  page.tsx          # 首页：选集、统计、每日一诗
  poems/            # 检索与列表（服务端 API）
  poem/  collections/  authors/  mengxue/  favorites/
  api/
    poems/          # 列表/检索 API（?c=、?q=、?author=、?ids=、page/size）
    poem/[id] daily random
  sitemap.ts  robots.ts  globals.css
components/  lib/  scripts/
seed/               # D1 schema + seed SQL 分片（构建产物）
tests/
.github/workflows/deploy.yml
```

## 快速开始

```bash
npm install
npm run build-data   # 从 ../cf-poetry-data 编译（或沿用已提交数据）
npm run dev
npm run build
npm test
```

## 部署（Cloudflare Workers + D1）

1. 创建 D1：`wrangler d1 create letter-poetry-db`（binding `DB` 已在 `vite.config.ts` 配置）。
2. 应用 schema 并导入数据（注意免费版每日 10 万行写配额，seed 已分片）：
   ```bash
   npx wrangler d1 execute letter-poetry-db --remote --file=seed/0001_schema.sql
   npx wrangler d1 execute letter-poetry-db --remote --file=seed/seed_01.sql
   # …seed_02..08（每片约 6000 首；含主键索引每首计 2 行写）
   ```
3. push 到 `main` —— GitHub Actions 执行 build + test + `wrangler deploy --config dist/server/wrangler.json --name letter-poetry`。

Secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`。Worker 绑定 **poetry.myletter.top** 与 D1 `letter-poetry-db`（binding `DB`）。

## 配置与环境变量

无需运行时环境变量；数据经 D1 binding（`DB`）访问。选集列表数据为小型静态文件，全文在 D1。

## 数据许可

文本数据来自 [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)（MIT License），含全唐诗；文本以原始古籍为准。

## License

本仓库未附带 LICENSE，默认保留所有权利；复用前请联系作者。

## 致谢

- Letter Network 家族成员站，共用设计令牌。
- 诗文数据： [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)（MIT）。
- 基于 [Next.js](https://nextjs.org)、[vinext](https://github.com/cloudflare/vinext) 与 Cloudflare D1 构建。