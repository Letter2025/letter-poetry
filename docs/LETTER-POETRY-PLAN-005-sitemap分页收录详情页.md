# LETTER-POETRY-PLAN-005-sitemap分页收录详情页

> 计划状态：⏳ 实施中 ｜ 创建日期：2026-08-07 ｜ 目标：通过 sitemap index + 分页子文件，让搜索引擎收录全部 47,629 个详情页

## 一、背景

现状 `app/sitemap.ts` 只列精选（首页/选集/作者/蒙学），4.7 万详情页未被 sitemap 覆盖，搜索引擎难以收录。标准做法：sitemap index + 分页子文件（每文件 ≤50,000 条）。

## 二、方案

- `/sitemap.xml`：**sitemap index**，引用 `/sitemap-static.xml`（精选）+ `/sitemap/1..N`（详情页分页，每页 10,000 条，4.7 万 → 5 页）。
- `/sitemap-static.xml`：首页/选集/作者/蒙学/收藏（bundle 数据生成，无需 D1）。
- `/sitemap/[page]/route.ts`：详情页分页，D1 `SELECT id FROM poems ORDER BY id LIMIT 10000 OFFSET ...`。
- 缓存：sitemap 路径加入 worker Cache API 缓存前缀（TTL 1 天），避免爬虫重复查 D1。
- `robots.ts` 已指向 `/sitemap.xml`，不变。
- 删除旧 `app/sitemap.ts`（避免与 `/sitemap.xml` route 冲突）。

## 三、文件清单

### 新建
| 文件 | 说明 | 状态 |
|---|---|---|
| `docs/LETTER-POETRY-PLAN-005-sitemap分页收录详情页.md` | 本计划 | ✅ |
| `app/sitemap.xml/route.ts` | sitemap index | ⏳ |
| `app/sitemap-static.xml/route.ts` | 精选子 sitemap | ⏳ |
| `app/sitemap/[page]/route.ts` | 详情页分页 sitemap | ⏳ |

### 修改
| 文件 | 说明 | 状态 |
|---|---|---|
| `lib/db.ts` | 加 getPoemCount / getPoemIdsPage | ⏳ |
| `app/sitemap.ts` | 删除（由 route 替代） | ⏳ |
| `worker/index.ts` | 缓存前缀加 `/sitemap` | ⏳ |
| `tests/rendered-html.test.mjs` | sitemap 产物断言（可选） | ⏳ |
| `AGENTS.md` / `.learnings` | 文档 | ⏳ |

## 四、实施顺序

1. db.ts 查询 → 2. routes + 删 sitemap.ts → 3. worker 缓存前缀 → 4. 构建/测试/部署 → 5. 线上验证（/sitemap.xml、/sitemap/1、/sitemap/5、robots）

## 五、风险与应对

| 风险 | 应对 |
|---|---|
| sitemap 分页查 D1 读额度 | 每页 10,000 行读；爬虫低频 + Cache API 缓存 1 天，额度充足 |
| sitemap 文件超限 | 每页 10,000 条 < 50,000 上限，文件 <1MB < 50MB |
| 旧 sitemap.ts 与 route 冲突 | 删除旧文件 |

## 六、变更记录

| 日期 | 内容 |
|---|---|
| 2026-08-07 | 创建计划 |