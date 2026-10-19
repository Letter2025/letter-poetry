# LETTER-POETRY-PLAN-014：D1 行读配额治理——随机/每日一诗改「静态 id + 主键直查」

- **状态**：✅ 代码与测试完成（未提交、未部署）
- **日期**：2026-10-18
- **关联**：[PLAN-002](LETTER-POETRY-PLAN-002-架构升级支持全量诗词.md)（数据进 D1）、PLAN-005（sitemap 静态分片）、PLAN-006（搜索）

## 1. 事故（2026-10-18）

- 现象：同日 21:00（CST）小说 App 阅读页无法拉取章节（`letter-novel-db` 被限流），约 21:20 自愈。
- 账号级 D1 行读（`rowsRead`，GraphQL `d1AnalyticsAdaptiveGroups`）：10-18 = **33,571,106**（免费额度 5,000,000 行读/天）。
- 分库（全期）：`letter-poetry-db`（`2b40b040-71d5-4931-b6a3-d963b158003c`）34,733,414 行；`letter-novel-db` 仅 8,798 行 ⇒ 打满额度的是诗词站，而**限额是账号级**，所有库一起被限流——这才是小说 App 故障的根因。
- 分钟级定位（`2026-10-18T08:13Z` = 16:13 CST）：**941 次读查询 / 33,570,861 行**，平均 35,675 行/查询。
- 归因：`/api/poem/random`（`lib/db.ts` 的 `getRandomPoemRow`）此前为 `SELECT COUNT(*) FROM poems`（全表 47,629 行）+ `SELECT … LIMIT 1 OFFSET n`（平均 23,814 行）⇒ 每次约 **71,443 行**；约 470 次调用 × 2 条查询 = 940 次、33.6M 行，与观测值吻合（941 次 / 33,570,861 行）。该小时 Worker 请求 674 次（常态 19 次/小时）⇒ 属爬虫/脚本式突发，非站点自身轮询。

## 2. 改动

| 位置 | 之前 | 现在 |
|---|---|---|
| `lib/db.ts` `getRandomPoemRow()` | `COUNT(*)` 全表 + `OFFSET` 逐行扫 | 静态 id 池随机 + `WHERE id = ?`（期望 1 行；缺号顺延 ≤8 次） |
| `lib/db.ts` `getDailyPoemRow()` | 静态 total 算 offset + `OFFSET` 扫 | 静态 id 池按日期取位 + 主键直查 |
| `lib/db.ts` `searchPoems()` 无筛选计数 | `COUNT(*)` 全表 | `collections-meta.total`（0 D1 读） |
| `app/api/poem/random/route.ts` | `no-store` | `public, max-age=0, s-maxage=15` |
| `app/api/poem/daily/route.ts` | `no-store` | `public, max-age=0, s-maxage=600` |
| `app/api/poems/route.ts` | `no-store` | `public, max-age=0, s-maxage=60` |
| `tests/d1-scan-guards.test.mjs` | — | 新增 4 项回归守卫（禁全表扫 / 静态池一致 / 路由带缓存头） |

- 语义影响：「随机一首」在 15s 边缘缓存窗口内对同一 PoP 返回同一首（按钮点击即跳转，实际不可感知）；「每日一诗」全站同一首（CST 零点换），10 分钟缓存不改变行为。

## 3. 验证

- `npm test`：**11 项通过**（含 4 项新守卫）。
- `npm run build`：构建成功（vinext；`dist/server/wrangler.json` 名称与 D1 binding 正确）。
- 静态池实测：`lib/generated/sitemap-ids.json` 47,629 条、无重复、与 `collections-meta.total` 一致；2026-10-18 索引 18,693 → `quantangshi-15086`。
- 线上核验（待部署后）：`/api/poem/random` 响应头应为 `s-maxage=15`，D1 行读应回到个位数/次。

## 4. 残留风险（未处理）

- `searchPoems` 带 `q` 时 `LIKE '%q%'` + `COUNT(*)` 仍是两次全表扫（≈95K 行/次）⇒ 已用 60s 边缘缓存削峰；若再复发需 FTS/预分片或面板侧速率限制。
- `collection = ?` **无索引**（选集分页每页仍全表扫）⇒ 建议在配额重置日建 `idx_poems_collection`（写 ≈47.6K 行 < 每日 10 万写额度）。
- 未加 Cloudflare 速率限制/WAF 规则（面板侧账号配置）。

## 5. 变更记录

- 2026-10-18：建立文档；完成根因定位（随机接口全表扫 × 突发调用）、静态 id 改造与守卫测试；线上部署待用户指令。
