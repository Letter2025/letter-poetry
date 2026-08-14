<!-- README-LANGUAGES: en,zh-CN,zh-TW -->
[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

# Letter Poetry · Classical Chinese Poetry Archive

> A searchable, readable, collectible archive of classical Chinese poetry — Tang verse, Song lyrics, the Book of Songs, Chu Ci, Yuan opera and more.

**Live site:** https://poetry.myletter.top · **Part of Letter Network** · **GitHub:** https://github.com/Letter2025/letter-poetry
**Icon:** https://poetry.myletter.top/favicon-64.png

## Why This Project

Classical Chinese poetry is a shared cultural inheritance, but most online collections are cluttered, ad-heavy or hard to search. This archive rebuilds the reading experience around the text itself: clean typography, full-text search, notes and vernacular translations, and per-poem stable URLs. Data is stored in Cloudflare D1 and queried server-side, so the site stays fast even as the corpus grows well beyond what a bundled static archive could hold.

## What “Letter” Means

Letter is the unified personal brand and the collective noun for this set of knowledge assets. Poetry is the oldest form of "letter" — words written to be read across centuries. This site keeps those words readable, searchable and beautiful.

## Features

- **Daily poem & random** — a poem a day and one-click random reading.
- **47,600+ poems** — the Complete Tang Poems (一期 44,020, first 44 juan) plus the original 12 collections (Tang 300, Song Ci 300, Book of Songs, Chu Ci, Yuan opera, Huajian Ji, Nalan Xingde…), with more juan added in later batches.
- **Server-side search** — title, author or verse via the `/api/poems` API backed by D1; no full-corpus download in the browser.
- **Detail pages** — original text, notes, vernacular translation, copy-to-clipboard, favorites.
- **Author index** — browse 2,390+ poets and writers at `/authors`.
- **Simplified / Traditional toggle** — switch the reading script without leaving the page.
- **Mengxue reading** — long-form primers (Three Character Classic, Guwen Guanzhi by volume…).
- **Dark mode & responsive** — shared Letter design tokens.
- **SEO & sharing** — per-poem pages, sitemap (collections/authors/mengxue), JSON-LD, Open Graph images, RSS feed and PWA manifest.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + vinext, deployed as a Cloudflare Worker
- **Storage:** Cloudflare D1 (`poems` table, id primary key only — fits the Free plan 100k rows-written/day); list data for collections/authors ships as small static files
- **Search:** server-side SQL `LIKE` on D1 (title/author/text), paginated API
- **Data build:** `scripts/build-data.mjs` compiles chinese-poetry JSON (simplified via chinese-conv), emits D1 seed SQL in shards + small static metadata
- **Runtime:** zero external API — all queries hit the site's own Worker + D1
- **CI/CD:** GitHub Actions → `cloudflare/wrangler-action@v3` (build + test + deploy)

## Directory Structure

```text
app/
  page.tsx          # Home: collections, stats, daily poem
  poems/            # Search & list (server-side API)
  poem/  collections/  authors/  mengxue/  favorites/
  api/
    poems/          # list/search API (?c=, ?q=, ?author=, ?ids=, page/size)
    poem/[id] daily random
  sitemap.ts  robots.ts  globals.css
components/  lib/  scripts/
seed/               # D1 schema + sharded seed SQL (generated)
tests/
.github/workflows/deploy.yml
```

## Getting Started

```bash
npm install
npm run build-data   # compile from ../cf-poetry-data (or reuse committed data)
npm run dev
npm run build
npm test
```

## Deployment (Cloudflare Workers + D1)

1. Create the D1 database once: `wrangler d1 create letter-poetry-db` (binding `DB` is configured in `vite.config.ts`).
2. Apply schema and seed (mind the Free-plan 100k rows-written/day; seed ships in shards):
   ```bash
   npx wrangler d1 execute letter-poetry-db --remote --file=seed/0001_schema.sql
   npx wrangler d1 execute letter-poetry-db --remote --file=seed/seed_01.sql
   # …seed_02..08 (each ~6k poems; 2 rows written per poem incl. the primary-key index)
   ```
3. Push to `main` — GitHub Actions runs build + test + `wrangler deploy --config dist/server/wrangler.json --name letter-poetry`.

Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. The Worker is bound to **poetry.myletter.top** and to D1 `letter-poetry-db` (binding `DB`).

## Configuration & Environment Variables

No runtime environment variables; the D1 binding (`DB`) carries the database. Collection list data ships as small static files; full texts live in D1.

## Data License

Text data comes from [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) (MIT License), including the Complete Tang Poems; the text follows the original classical sources.

## License

No license file is included in this repository; all rights reserved by default. Please contact the author before reusing content.

## Acknowledgements

- Part of the Letter Network family with shared design tokens.
- Poetry data: [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) (MIT).
- Built on [Next.js](https://nextjs.org), [vinext](https://github.com/cloudflare/vinext) and Cloudflare D1.