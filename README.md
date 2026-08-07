# Letter Poetry · Classical Chinese Poetry Archive

> A searchable, readable, collectible archive of classical Chinese poetry — Tang and Song verse, the Book of Songs, Chu Ci, Yuan opera and more.

**Live site:** https://poetry.myletter.top · **Part of Letter Network** · **GitHub:** https://github.com/Letter2025/letter-poetry
**Icon:** https://poetry.myletter.top/favicon-64.png

## Why This Project

Classical Chinese poetry is a shared cultural inheritance, but most online collections are cluttered, ad-heavy or hard to search. This archive rebuilds the reading experience around the text itself: clean typography, full-text search, notes and vernacular translations, and per-poem stable URLs — everything bundled at build time so the site is fast and needs no external API at runtime. It is the literary wing of Letter.

## What “Letter” Means

Letter is the unified personal brand and the collective noun for this set of knowledge assets. Poetry is the oldest form of "letter" — words written to be read across centuries. This site keeps those words readable, searchable and beautiful.

## Features

- **Daily poem & random** — a poem a day and one-click random reading.
- **13 collections** — Tang Poems 300 (~320), Thousand Family Poems (~220), Song Ci 300 (280), Book of Songs (305), Chu Ci (65), Yuan Opera (1,200 selected), Huajian Ji (~500), Southern Tang rulers' ci (45), Nalan Xingde (~260), Cao Cao (26), Ink-wash Tang poems (176), Youmeng Ying (219), Mengxue primers (231).
- **Full-text search** — by title, author or verse, falling back to full-text.
- **Detail pages** — original text, notes, vernacular translation, prev/next navigation and copy-to-clipboard.
- **Mengxue reading** — long-form primers (Three Character Classic, Hundred Family Surnames, Thousand Character Classic, Guwen Guanzhi…).
- **Dark mode & responsive** — shared Letter design tokens.
- **SEO** — per-poem pages, sitemap and JSON-LD structured data.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + vinext, deployed as a Cloudflare Worker
- **Data build:** `scripts/build-data.mjs` compiles raw JSON from [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) into a compact bundle
- **Conversion:** `chinese-conv` (traditional → simplified)
- **Runtime:** zero external API — all data ships inside the Worker bundle
- **CI/CD:** GitHub Actions → `cloudflare/wrangler-action@v3`

## Directory Structure

```text
app/
  page.tsx          # Home: daily poem, random, collections
  poems/            # Poem list + detail
  poem/  collections/  # Collection browsing
  mengxue/          # Long-form primer reading
  sitemap.ts  robots.ts  # SEO
  globals.css       # Letter design tokens
components/
  daily-poem.tsx  collection-browser.tsx  poem-actions.tsx  chrome.tsx
lib/                # Data loading / search helpers
scripts/
  build-data.mjs    # Compiles data from ../cf-poetry-data (or committed data)
public/  worker/  build/
.github/workflows/deploy.yml  # CI deployment
```

## Getting Started

### Prerequisites

- Node.js 22+

### Install

```bash
npm install
```

### Build data (optional)

```bash
npm run build-data   # compiles from ../cf-poetry-data; falls back to committed data
```

### Develop

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Deployment (Cloudflare Workers)

GitHub Actions (`.github/workflows/deploy.yml`) runs on push to `main`:

1. `npm ci` + `npm run build`
2. `wrangler deploy --config dist/server/wrangler.json --name letter-poetry`

Manual equivalent:

```bash
npm run build
npx wrangler deploy --config dist/server/wrangler.json --name letter-poetry
```

Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. The Worker is bound to **poetry.myletter.top**.

## Configuration & Environment Variables

No runtime environment variables are required; all text data is bundled at build time.

## Data License

Text data comes from [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) (MIT License); the text follows the original classical sources.

## License

No license file is included in this repository; all rights reserved by default. Please contact the author before reusing content.

## Acknowledgements

- Part of the Letter Network family with shared design tokens.
- Poetry data: [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) (MIT).
- Built on [Next.js](https://nextjs.org) and [vinext](https://github.com/cloudflare/vinext).
