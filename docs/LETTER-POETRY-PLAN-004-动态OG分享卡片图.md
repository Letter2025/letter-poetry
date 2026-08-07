# LETTER-POETRY-PLAN-004-动态OG分享卡片图

> 计划状态：✅ 全部完成 ｜ 创建日期：2026-08-07 ｜ 完成日期：2026-08-07 ｜ 目标：每首诗详情页动态生成 OG 分享卡片图（标题/作者/首句）

## 一、背景

详情页 og:image 原本共用一张 `/og.png`，分享到社交平台无差异化。目标：每首诗生成专属卡片图。

## 二、方案与关键技术结论

- **渲染栈**：`satori`（JSX→SVG）+ `@resvg/resvg-wasm`（SVG→PNG），route `app/og/[id]/route.tsx` 查 D1 渲染。
- **关键 1**：Cloudflare Workers **禁止动态编译 WASM**，`@vercel/og` 的 resvg 运行时加载 wasm 失败（空 body）；必须 `import wasm from "...wasm?module"` 静态导入（wrangler 预编译）。
- **关键 2**：satori 的字体解析（opentype.js）**不支持 woff2**，需 ttf/otf；运行时从 CDN 加载 Noto Sans SC ttf（模块级缓存 + 重试）。
- **缓存**：响应 `Cache-Control: public, max-age=3600, s-maxage=86400`。
- 详情页 `og:image` 指向 `/og/{id}`（metadataBase 拼绝对 URL）。

## 三、文件清单

| 文件 | 说明 | 状态 |
|---|---|---|
| `docs/LETTER-POETRY-PLAN-004-动态OG分享卡片图.md` | 本计划 | ✅ |
| `app/og/[id]/route.tsx` | 动态卡片图 route（satori + resvg-wasm 静态导入 + ttf 字体） | ✅ |
| `app/poem/[id]/page.tsx` | og:image 指向 `/og/{id}` | ✅ |
| `package.json` | 依赖：satori、@resvg/resvg-wasm（移除 @vercel/og） | ✅ |
| `AGENTS.md` | OG 方案说明 | ✅ |

## 四、验证

- 本地：satori（ttf）→ SVG → resvg-wasm → PNG 成功。
- 线上：`/og/tangshi300-001` 200 + 有效 PNG（32KB）、`/og/quantangshi-44020` 200（45KB）；详情页 og:image 指向动态图。
- bundle gzip 0.84MB（免费 3MB 内）。

## 五、变更记录

| 日期 | 内容 |
|---|---|
| 2026-08-07 | 创建并完成 |