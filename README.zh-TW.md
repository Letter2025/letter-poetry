<!-- README-LANGUAGES: en,zh-CN,zh-TW -->
[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

# Letter Poetry · 古典詩文檔案

> 可檢索、可細讀、可收藏的在線詩文集 —— 唐詩、宋詞、詩經、楚辭、元曲與蒙學經典，一處安放。

**線上地址：** https://poetry.myletter.top · **Letter Network 成員站** · **GitHub：** https://github.com/Letter2025/letter-poetry
**圖標：** https://poetry.myletter.top/favicon-64.png

## 項目立項（Why）

古典詩文是共同的文化遺產，但多數在線合集雜亂、廣告多、難以檢索。本檔案圍繞「文本本身」重建閱讀體驗：干淨的排版、全文檢索、注釋與白話譯文、每篇獨立的穩定 URL。數據存儲在 Cloudflare D1、由服務端檢索，因此即使館藏遠超「靜態打包」的容量上限，站點依然保持快速。

## 寓意（What 「Letter」 Means）

Letter 是統一個人品牌，也是這套知識資產的集合名詞。詩歌是最古老的「信」——寫下來、跨越千年仍可被閱讀的文字。本站讓這些文字保持可讀、可檢索與優美。

## 功能特性

- **每日一詩與隨機** —— 每天一首，一鍵隨機閱讀。
- **47,000+ 篇目** —— 全唐詩（一期前 44 卷 44,020 首）+ 原 12 部選集（唐詩三百、宋詞三百、詩經、楚辭、元曲、花間集、納蘭性德…），後續分批擴錄更多卷。
- **服務端檢索** —— 按標題 / 作者 / 詩句，經由 `/api/poems`（D1 支撐）檢索；瀏覽器無需下載全庫。
- **詳情頁** —— 正文、注釋、白話譯文、復制全文、收藏。
- **作者索引** —— 在 `/authors` 瀏覽 2,390+ 位詩人與文人。
- **繁簡切換** —— 閱讀正文可隨時在簡體 / 繁體之間切換。
- **蒙學長文閱讀** —— 三字經、古文觀止（按卷分組）等。
- **深色模式與響應式** —— 共用 Letter 設計令牌。
- **SEO 與分享** —— 每篇獨立頁面 + sitemap（選集/作者/蒙學）+ JSON-LD + Open Graph 卡片圖 + RSS + PWA Manifest。

## 技術棧

- **框架：** Next.js 16（App Router）+ vinext，部署為 Cloudflare Worker
- **存儲：** Cloudflare D1（`poems` 表，僅 id 主鍵索引，適配免費版每日 10 萬行寫配額）；選集/作者列表走小型靜態文件
- **檢索：** D1 上的服務端 SQL `LIKE`（標題/作者/正文），分頁 API
- **數據構建：** `scripts/build-data.mjs` 編譯 chinese-poetry JSON（chinese-conv 轉簡），產出 D1 seed SQL 分片 + 小型靜態元數據
- **運行時：** 零外部 API —— 全部查詢走本站 Worker + D1
- **CI/CD：** GitHub Actions → `cloudflare/wrangler-action@v3`（build + test + deploy）

## 目錄結構

```text
app/
  page.tsx          # 首頁：選集、統計、每日一詩
  poems/            # 檢索與列表（服務端 API）
  poem/  collections/  authors/  mengxue/  favorites/
  api/
    poems/          # 列表/檢索 API（?c=、?q=、?author=、?ids=、page/size）
    poem/[id] daily random
  sitemap.ts  robots.ts  globals.css
components/  lib/  scripts/
seed/               # D1 schema + seed SQL 分片（構建產物）
tests/
.github/workflows/deploy.yml
```

## 快速開始

```bash
npm install
npm run build-data   # 從 ../cf-poetry-data 編譯（或沿用已提交數據）
npm run dev
npm run build
npm test
```

## 部署（Cloudflare Workers + D1）

1. 創建 D1：`wrangler d1 create letter-poetry-db`（binding `DB` 已在 `vite.config.ts` 配置）。
2. 應用 schema 並導入數據（注意免費版每日 10 萬行寫配額，seed 已分片）：
   ```bash
   npx wrangler d1 execute letter-poetry-db --remote --file=seed/0001_schema.sql
   npx wrangler d1 execute letter-poetry-db --remote --file=seed/seed_01.sql
   # …seed_02..08（每片約 6000 首；含主鍵索引每首計 2 行寫）
   ```
3. push 到 `main` —— GitHub Actions 執行 build + test + `wrangler deploy --config dist/server/wrangler.json --name letter-poetry`。

Secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`。Worker 綁定 **poetry.myletter.top** 與 D1 `letter-poetry-db`（binding `DB`）。

## 配置與環境變量

無需運行時環境變量；數據經 D1 binding（`DB`）訪問。選集列表數據為小型靜態文件，全文在 D1。

## 數據許可

文本數據來自 [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)（MIT License），含全唐詩；文本以原始古籍為准。

## License

本倉庫未附帶 LICENSE，默認保留所有權利；復用前請聯系作者。

## 致謝

- Letter Network 家族成員站，共用設計令牌。
- 詩文數據： [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)（MIT）。
- 基於 [Next.js](https://nextjs.org)、[vinext](https://github.com/cloudflare/vinext) 與 Cloudflare D1 構建。