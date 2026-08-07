# LETTER-POETRY-PLAN-002-架构升级支持全量诗词

> 计划状态：✅ 全部完成（含数据补导）｜ 创建日期：2026-08-07 ｜ 完成日期：2026-08-07 ｜ 目标：架构升级为 D1 + 服务端检索，承载全唐诗全量，保持在 Cloudflare 免费版限制内

## 一、背景

现状：letter-poetry 为「全静态打包」架构，数据（collections.json 1.48MB + full.json 1.28MB）全部打进 Worker bundle / Assets，客户端全文检索拉取 full.json 全量。已收录 3,609 首诗 + 231 篇蒙学。

用户需求：添加更多诗词（数据源含全唐诗 57,607 首、全宋词约 21,000 首、全宋诗约 25 万首）。

经核验的约束（官方文档 2026-07）：
- Workers 免费版 bundle 压缩后 **3MB**（付费 10MB）——全量数据无法打包，必须移出 bundle
- D1 免费：存储 5GB、**读 500 万行/天、写 10 万行/天**（超限当天锁库）、支持 **FTS5**
- vinext 原生支持 D1：server component / route handler 用 `import { env } from "cloudflare:workers"` 访问 `env.DB`
- FTS5 默认 unicode61 分词把连续中文当一个 token → 需用「单字索引 + 候选精排」实现中文全文搜索

结论：架构升级为 **D1 存储（poems + poems_fts）+ Assets 静态分片 + 服务端检索**，数据移出 bundle，保持在免费版额度内。

## 二、数据规模与写入额度策略

- **一期（本次）**：全唐诗前 44,000 首（分片 poet.tang.0 ~ poet.tang.43000，前 44 卷）+ 现有选集/蒙学 ≈ 4.71 万首。两表写入 ≈ 9.4 万行/天，**低于 10 万上限，留 6% 余量**。
- **二期（后续）**：全唐诗剩余约 13,600 首 + 全宋词（约 2.1 万）≈ 3.5 万首 → 7 万行写，一次部署可完成；需在**次日（UTC 00:00 重置后）**执行，避开单日 10 万上限。
- 全宋诗（25 万首）暂不收录（写入额度与检索体量超免费层，留待按需规划）。

## 三、分段方案

- **段 1 基础设施**：Cloudflare API 创建 D1 `letter-poetry-db`；确认 D1 binding 注入 `dist/server/wrangler.json`（vite.config.ts localBindingConfig 或 wrangler.jsonc）；本地验证 server component 读 env.DB 的构建产物。
- **段 2 数据层**：扩展 `scripts/build-data.mjs`：编译全唐诗（sify 转简、去朝代前缀、按卷生成 quantangshi-XXXXX id）、生成 D1 seed SQL（分片：schema + poems + poems_fts 单字索引）、生成 Assets 静态分片（选集元数据、作者聚合、收藏查找表）；保留现有 12 选集与蒙学编译。
- **段 3 D1 schema 与导入**：`CREATE TABLE poems(...)` + `CREATE VIRTUAL TABLE poems_fts USING fts5(pid UNINDEXED, title, author, chars)`；用 wrangler d1 execute 分片导入（单日写 < 10 万）；导入幂等（INSERT OR REPLACE / 先清空）。
- **段 4 数据访问层**：新增 `lib/db.ts`（封装 env.DB：getPoem / getCollection / getAuthor / searchPoems / getIndexMeta）；构建期小元数据（collections-meta.json）保留在 bundle 供首页/统计使用。
- **段 5 页面改造**：详情页 `/poem/[id]` 改动态渲染（server component 查 D1，不再 generateStaticParams 全量）；`/poems` 搜索改服务端（FTS 单字候选 + 精确子串精排）；`/collections/[key]`、`/authors/[slug]`、`/mengxue` 改查 D1 / Assets；首页统计用 collections-meta.json。
- **段 6 API 与瘦身**：新增 `/api/search`、`/api/poems`（分页/选集过滤）；移除 lib/generated/collections.json、public/data/full.json 等大文件出 bundle；sitemap 改为动态/精选（不再逐首 5.8 万条）。
- **段 7 测试与 CI**：更新 `tests/rendered-html.test.mjs`（schema/seed/产物断言）；deploy.yml 增加 D1 创建与 seed 导入步骤（幂等、单日额度安全）。
- **段 8 文档收尾**：README 三语言、AGENTS.md、.learnings 更新；PLAN-002 标记完成。

## 四、文件清单

### 新建
| 文件 | 说明 | 状态 |
|---|---|---|
| `docs/LETTER-POETRY-PLAN-002-架构升级支持全量诗词.md` | 本计划 | ✅ |
| `lib/db.ts` | D1 数据访问层（env.DB 封装） | ⏳ |
| `app/api/search/route.ts` | 全文搜索 API | ⏳ |
| `app/api/poems/route.ts` | 列表/选集分页 API | ⏳ |
| `scripts/seed-d1.mjs` | 生成 D1 seed SQL（分片） | ⏳ |
| `migrations/0001_init.sql` | D1 schema（poems + poems_fts） | ⏳ |

### 修改
| 文件 | 说明 | 状态 |
|---|---|---|
| `scripts/build-data.mjs` | 全唐诗编译、单字索引、Assets 分片、seed SQL | ⏳ |
| `vite.config.ts` | D1 binding 注入（localBindingConfig.d1_databases） | ⏳ |
| `lib/poetry.ts` / `lib/types.ts` | 数据访问改 D1 / 元数据 | ⏳ |
| `app/poem/[id]/page.tsx` | 动态渲染查 D1 | ⏳ |
| `app/poems/page.tsx` | 服务端搜索 | ⏳ |
| `app/collections/[key]/page.tsx` | 查 D1 / Assets | ⏳ |
| `app/authors/*` | 查 D1 / Assets | ⏳ |
| `app/mengxue/*` | 查 D1 / Assets（或保留小数据） | ⏳ |
| `app/page.tsx` | 统计用 collections-meta | ⏳ |
| `app/sitemap.ts` | 动态/精选 | ⏳ |
| `tests/rendered-html.test.mjs` | 更新断言 | ⏳ |
| `.github/workflows/deploy.yml` | D1 创建 + seed 导入 | ⏳ |
| `README*` / `AGENTS.md` / `.learnings` | 文档 | ⏳ |

### 删除（出 bundle）
| 文件 | 说明 | 状态 |
|---|---|---|
| `lib/generated/collections.json`（bundle 大文件） | 数据移 D1 | ⏳ |
| `public/data/full.json` | 全文检索改服务端 | ⏳ |

## 五、实施顺序

1. 段 1（D1 创建 + binding）→ 段 2（数据编译/seed 生成）→ 段 3（schema + 导入）
2. 段 4（db.ts）→ 段 5（页面）→ 段 6（API/瘦身）
3. 段 7（测试/CI）→ 段 8（文档）
4. 推送部署 → 线上验证

## 六、风险与应对

| 风险 | 应对 |
|---|---|
| D1 免费写 10 万行/天上限 | 一期 4.7 万首两表 ≈ 9.4 万行写，留 6% 余量；二期次日导入 |
| FTS5 中文分词（整句单 token） | 单字索引（chars 列 = 正文去重单字空格分隔）+ FTS 候选 + 精确子串精排 |
| vinext D1 binding 实验性 | README 明确支持；段 1 先做最小构建验证，失败则降级为 route handler + fetch 方案 |
| 详情页动态渲染延迟（D1 查询） | 单行主键查询，预计 <20ms；必要时开启 KV 缓存 |
| 全唐诗与现有唐诗选集重复条目 | 不同选集独立 id（选集视角 vs 全集视角），README 说明 |
| seed 导入 SQL 体积 | 分片（每片 <5 万行写），wrangler d1 execute 分批执行 |

## 七、变更记录

| 日期 | 内容 |
|---|---|
| 2026-08-07 | 创建计划 |
| 2026-08-07 | 完成：D1 letter-poetry-db 创建并绑定；数据编译扩展全唐诗一期 44,020 首；seed 分 8 片（去 FTS、仅主键索引，适配 rows_written 配额）；页面改造（详情/作者动态查 D1、搜索走 API、bundle 瘦身）；CI 部署上线；线上验证通过（详情/搜索/作者/每日/随机全 200） |
| 2026-08-07 | 数据补导完成：seed_06-08 已导入，D1 共 47,629 首（quantangshi 44,020 + 12 选集 3,609），与 collections-meta 一致；线上验证 quantangshi total=44020、搜索/详情/首页均正常 |
| 2026-08-07 | 关键实测：D1 rows_written 按行+索引计数（普通行 1+主键 1=2/首；FTS5 ≈5/首；旧多索引 4/首）；单条 SQL 语句长度上限 <54KB（按 40KB 字节分批）；不支持 SQL 事务语句（BEGIN/COMMIT） |