# LETTER-POETRY-PLAN-001-站点完善

> 计划状态：✅ 全部完成 ｜ 创建日期：2026-08-07 ｜ 完成日期：2026-08-07 ｜ 目标：修复调研报告中的 A/B/C/D 全部问题

## 一、背景

2026-08-07 对 letter-poetry（https://poetry.myletter.top）做代码调研，发现以下可完善点：

- **A 类缺陷**：A1 详情页 `lang="zh-Hant"` 与实际简体数据不符；A2 首页/README 承诺「可收藏」但无实现；A3 `npm test` 指向不存在的 `tests/rendered-html.test.mjs`；A4 package.json description 乱码。
- **B 类不一致**：README/AGENTS.md 写「13 collections」，实际为 12 部选集 + 蒙学独立模块。
- **C 类增强**：C6 繁简切换阅读（依赖已有 chinese-conv）；C7 作者维度浏览缺失；C8 全文检索需全量拉取 12 个 collection JSON；C9 详情页缺 og:image；C10 无 RSS；C11 无 PWA Manifest；C12 `generatedAt` 用 UTC 日期与本地日期可能偏差；C13 古文观止无卷分组。
- **D 类清理**：D14 `public/icon-source.png`（1.8MB）打入部署资源；D15 根目录 vinext-start 日志残留；D16 `.openai/hosting.json` 为 Sites 模板残留。

## 二、分段方案

- **段 1 数据层重构**：扩展 `scripts/build-data.mjs` 生成 `public/data/full.json`（全文检索精简全集）、`public/data/authors.json`（作者聚合）、`public/rss.xml`（静态 RSS）、蒙学古文观止按卷写入 `section` 字段、`generatedAt` 改用 Asia/Shanghai 本地日期；同步更新 `lib/types.ts`、`lib/poetry.ts`。
- **段 2 繁简阅读 + lang 修复**：新增 `lib/script.ts`（繁简状态）、`components/script-toggle.tsx`（切换按钮）、`components/poem-text.tsx`（正文渲染，按当前脚本转换并设置正确 lang）；详情页、蒙学详情、每日一诗接入。
- **段 3 收藏功能**：`components/poem-actions.tsx` 增加收藏/取消收藏；新增 `/favorites` 收藏页；header 增加入口。
- **段 4 作者浏览**：新增 `/authors`（作者索引，可搜索）与 `/authors/[slug]`（该作者诗列表）；header 增加入口。
- **段 5 全文检索优化**：`app/poems/page.tsx` 全文检索改拉 `full.json`（单请求），替换 12 个 collection 并发拉取。
- **段 6 SEO 与元数据**：详情页/蒙学详情 openGraph 增加 og:image；新增 `public/manifest.webmanifest` 与 `icon-512.png`；layout metadata 增加 manifest / themeColor / appleWebApp。
- **段 7 蒙学卷分组**：`app/mengxue/page.tsx` 古文观止按卷分组展示。
- **段 8 测试与 CI**：新增 `tests/rendered-html.test.mjs`（数据完整性 + 产物断言）；package.json 修复 description 与 test 脚本；deploy.yml 增加 `npm test`。
- **段 9 文档同步**：README 三语言与 AGENTS.md 统一选集口径（12 部 + 蒙学独立）并补充新功能。
- **段 10 清理**：`public/icon-source.png` 移入 `docs/assets/`；删除本地 vinext-start 日志残留；删除 `.openai/hosting.json`（Sites 模板残留）。

## 三、文件清单

### 新建

| 文件 | 说明 | 状态 |
|---|---|---|
| `docs/LETTER-POETRY-PLAN-001-站点完善.md` | 本计划文档 | ✅ |
| `lib/script.ts` | 繁简脚本状态（客户端） | ⏳ |
| `components/script-toggle.tsx` | 繁简切换按钮 | ⏳ |
| `components/poem-text.tsx` | 正文渲染（含繁简转换与 lang） | ⏳ |
| `app/authors/page.tsx` | 作者索引页 | ⏳ |
| `app/authors/[slug]/page.tsx` | 作者诗列表页 | ⏳ |
| `app/favorites/page.tsx` | 收藏页 | ⏳ |
| `tests/rendered-html.test.mjs` | 数据与产物冒烟测试 | ⏳ |
| `public/manifest.webmanifest` | PWA Manifest | ⏳ |
| `public/icon-512.png` | PWA 图标 512 | ⏳ |
| `public/data/full.json` | 全文检索精简全集（构建产物） | ⏳ |
| `public/data/authors.json` | 作者聚合（构建产物） | ⏳ |
| `public/rss.xml` | 静态 RSS（构建产物） | ⏳ |
| `docs/assets/icon-source.png` | 图标源文件移入（原 public/icon-source.png） | ⏳ |

### 修改

| 文件 | 说明 | 状态 |
|---|---|---|
| `scripts/build-data.mjs` | 生成 full.json / authors.json / rss.xml / section / 本地日期 | ⏳ |
| `lib/types.ts` | 增加 Author 类型、MengxueDoc.section | ⏳ |
| `lib/poetry.ts` | 增加 getAuthors / getAuthor | ⏳ |
| `components/chrome.tsx` | header 增加 繁简切换/作者/收藏 入口 | ⏳ |
| `components/poem-actions.tsx` | 收藏按钮，接收 id | ⏳ |
| `components/daily-poem.tsx` | 每日一诗正文繁简转换 | ⏳ |
| `app/page.tsx` | 统计/入口微调 | ⏳ |
| `app/poems/page.tsx` | 全文检索改拉 full.json | ⏳ |
| `app/poem/[id]/page.tsx` | PoemText、og:image、收藏 | ⏳ |
| `app/mengxue/[id]/page.tsx` | PoemText、og:image | ⏳ |
| `app/mengxue/page.tsx` | 古文观止按卷分组 | ⏳ |
| `app/layout.tsx` | manifest / themeColor / appleWebApp | ⏳ |
| `package.json` | description、test 脚本 | ⏳ |
| `.github/workflows/deploy.yml` | 增加 npm test | ⏳ |
| `README.md` / `README.zh-CN.md` / `README.zh-TW.md` | 数量口径与新功能 | ⏳ |
| `AGENTS.md` | 数量口径与目录结构 | ⏳ |
| `.learnings/LEARNINGS.md` | 收尾记录 | ⏳ |

### 删除

| 文件 | 说明 | 状态 |
|---|---|---|
| `public/icon-source.png` | 移入 docs/assets | ⏳ |
| `vinext-start.err.log` / `vinext-start.out.log` | 本地运行残留 | ⏳ |
| ~~`.openai/hosting.json`~~ | ~~Sites 模板残留~~ → 撤销：vite.config.ts 依赖此文件，保留 | ✅ |

## 四、实施顺序

1. 段 1（数据层）→ 运行 `npm run build-data` 重新生成数据
2. 段 2（繁简）→ 段 3（收藏）→ 段 4（作者）→ 段 5（检索）→ 段 6（SEO）→ 段 7（蒙学）
3. 段 8（测试/CI）→ 段 9（文档）→ 段 10（清理）
4. 验证：`npm run build` + `npm test` + git diff 审查

## 五、风险与应对

| 风险 | 应对 |
|---|---|
| vinext 对动态路由/新客户端组件的兼容性 | 全部新增页面为静态生成（generateStaticParams）或纯客户端组件；RSS/Manifest 用静态文件而非 route handler |
| 繁简转换的还原误差 | 数据源为繁体、构建期转简体，显示繁体时用 tify 转回，个别字存在一对多损耗；列表/检索保持简体，转换仅作用于正文阅读 |
| 作者名含特殊字符导致 URL 问题 | slug 用 encodeURIComponent，页面解码 |
| full.json 体积 | 精简字段（id/t/a/c/p），gzip 传输；仍保留分 collection 文件供详情页使用 |

## 六、变更记录

| 日期 | 内容 |
|---|---|
| 2026-08-07 | 创建计划 |
| 2026-08-07 | 全部完成：A/B/C/D 全部修复；数据层新增 full.json/authors.json/rss.xml/蒙学分卷；新增收藏/作者/繁简切换/Manifest；测试与 CI 就绪；.openai/hosting.json 因 vite.config.ts 依赖而保留（D16 撤销） |