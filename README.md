# Letter Poetry · 古典诗文档案

[poetry.myletter.top](https://poetry.myletter.top) — 可检索、可细读、可收藏的在线诗文集，Letter Network 站点之一。

## 内容范围

| 选集 | 数量 | 说明 |
|------|------|------|
| 唐诗三百首 | ~320 篇 | 蘅塘退士编选的经典唐诗选本 |
| 千家诗 | ~220 篇 | 蒙学诗选 |
| 宋词三百首 | 280 篇 | 朱孝臧选编 |
| 诗经 | 305 篇 | 风雅颂全收 |
| 楚辞 | 65 篇 | 含《离骚》全篇 |
| 元曲 | 1200 首精选 | 关汉卿、马致远等大家代表作 |
| 花间集 | ~500 首 | 中国第一部文人词总集 |
| 南唐二主词 | 45 首 | 李璟、李煜词作，附注释 |
| 纳兰性德 | ~260 首 | 纳兰词全集 |
| 曹操诗集 | 26 首 | 建安风骨 |
| 水墨唐诗 | 176 首 | 附白话译文 |
| 幽梦影 | 219 则 | 清言小品 |
| 蒙学 | 231 篇 | 三字经、百家姓、千字文、古文观止等 |

## 功能

- 首页每日一诗、随机一首、十二部选集入口
- 全库检索：标题 / 作者 / 诗句，自动进入全文检索
- 诗文详情：正文、注释、白话译文、上一篇 / 下一篇、复制全文
- 蒙学经典长文阅读
- 深色模式、响应式布局、SEO（每篇独立页面 + sitemap + JSON-LD）

## 技术栈

- Next.js 16 App Router + vinext，部署为 Cloudflare Workers（OpenNext 风格）
- 数据构建：`scripts/build-data.mjs` 从 [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) 原始 JSON 生成精简数据
- 繁转简：`chinese-conv`
- 全部数据随构建打包进 Worker bundle，运行时无需外部 API

## 本地开发

```bash
npm install
npm run build-data   # 从 ../cf-poetry-data 生成数据（数据源缺失时沿用已提交数据）
npm run dev
```

## 部署

```bash
npm run build
npx wrangler deploy --config dist/server/wrangler.json --name letter-poetry
```

GitHub Actions（`.github/workflows/deploy.yml`）在 push 到 main 时自动部署，需要仓库 Secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`。

## 数据许可

文本数据来自 [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)（MIT License），文本以原始古籍为准。