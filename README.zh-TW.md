# Letter Poetry · 古典詩文檔案

> 可檢索、可細讀、可收藏的在線詩文集 —— 唐詩宋詞、詩經楚辭、元曲與蒙學經典，一處安放。

**線上地址：** https://poetry.myletter.top · **Letter Network 成員站** · **GitHub：** https://github.com/Letter2025/letter-poetry
**圖標：** https://poetry.myletter.top/favicon-64.png

## 項目立項（Why）

古典詩文是共同的文化遺產，但多數在線合集雜亂、廣告多、難以檢索。本檔案圍繞「文本本身」重建閱讀體驗：干淨的排版、全文檢索、注釋與白話譯文、每篇獨立的穩定 URL——所有數據在構建時打包，運行時零外部 API，快而穩定。它是這封「Letter」的文學翼。

## 寓意（What 「Letter」 Means）

Letter 是統一個人品牌，也是這套知識資產的集合名詞。詩歌是最古老的「信」——寫下來、跨越千年仍可被閱讀的文字。本站讓這些文字保持可讀、可檢索與優美。

## 功能特性

- **每日一詩與隨機** —— 每天一首，一鍵隨機閱讀。
- **13 部選集** —— 唐詩三百首（~320）、千家詩（~220）、宋詞三百首（280）、詩經（305）、楚辭（65）、元曲（精選 1200）、花間集（~500）、南唐二主詞（45）、納蘭性德（~260）、曹操詩集（26）、水墨唐詩（176）、幽夢影（219）、蒙學（231）。
- **全文檢索** —— 按標題 / 作者 / 詩句，自動進入全文檢索。
- **詳情頁** —— 正文、注釋、白話譯文、上一篇 / 下一篇、復制全文。
- **蒙學長文閱讀** —— 三字經、百家姓、千字文、古文觀止等。
- **深色模式與響應式** —— 共用 Letter 設計令牌。
- **SEO** —— 每篇獨立頁面 + sitemap + JSON-LD。

## 技術棧

- **框架：** Next.js 16（App Router）+ vinext，部署為 Cloudflare Worker
- **數據構建：** `scripts/build-data.mjs` 將 [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) 原始 JSON 編譯為精簡數據
- **轉換：** `chinese-conv`（繁轉簡）
- **運行時：** 零外部 API —— 全部數據隨 Worker bundle 打包
- **CI/CD：** GitHub Actions → `cloudflare/wrangler-action@v3`

## 目錄結構

```text
app/
  page.tsx          # 首頁：每日一詩、隨機、選集入口
  poems/            # 詩文列表 + 詳情
  poem/  collections/  # 選集瀏覽
  mengxue/          # 蒙學經典長文閱讀
  sitemap.ts  robots.ts  # SEO
  globals.css       # Letter 設計令牌
components/
  daily-poem.tsx  collection-browser.tsx  poem-actions.tsx  chrome.tsx
lib/                # 數據加載 / 檢索工具
scripts/
  build-data.mjs    # 從 ../cf-poetry-data 編譯數據（缺失時沿用已提交數據）
public/  worker/  build/
.github/workflows/deploy.yml  # CI 部署
```

## 快速開始

### 環境要求

- Node.js 22+

### 安裝

```bash
npm install
```

### 構建數據（可選）

```bash
npm run build-data   # 從 ../cf-poetry-data 編譯；數據源缺失時沿用已提交數據
```

### 本地開發

```bash
npm run dev
```

### 構建

```bash
npm run build
```

## 部署（Cloudflare Workers）

GitHub Actions（`.github/workflows/deploy.yml`）在 push 到 `main` 時觸發：

1. `npm ci` + `npm run build`
2. `wrangler deploy --config dist/server/wrangler.json --name letter-poetry`

手動等價命令：

```bash
npm run build
npx wrangler deploy --config dist/server/wrangler.json --name letter-poetry
```

Secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`。Worker 綁定 **poetry.myletter.top**。

## 配置與環境變量

無需運行時環境變量；全部文本數據構建時打包。

## 數據許可

文本數據來自 [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)（MIT License），文本以原始古籍為准。

## License

本倉庫未附帶 LICENSE，默認保留所有權利；復用前請聯系作者。

## 致謝

- Letter Network 家族成員站，共用設計令牌。
- 詩文數據： [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)（MIT）。
- 基於 [Next.js](https://nextjs.org) 與 [vinext](https://github.com/cloudflare/vinext) 構建。
