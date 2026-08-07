# LETTER-POETRY-PLAN-003-详情页CDN边缘缓存

> 计划状态：⏳ 实施中 ｜ 创建日期：2026-08-07 ｜ 目标：为详情页/API 加 CDN 边缘缓存（Cache-Control），减少 D1 查询与延迟；不依赖 KV（免费写入 1000/天不够预热 4.7 万首）

## 一、背景

架构升级后详情页每次访问实时查 D1（响应头 `Cache-Control: no-store`），延迟 ~20-100ms 且消耗 D1 读额度（当前已用 758k/5M）。需求：给详情页加边缘缓存。

方案选型：**CDN 边缘缓存（Cache-Control 头）**，而非 KV：
- KV 免费：存储 1GB（够）、读 10 万/天（够）、**写 1000/天（不够）**——4.7 万首全量预热需 47 天。
- CDN 边缘缓存：无限写入、自动 TTL 失效、零成本；命中后不进 Worker、不查 D1。

站点无用户系统、无个性化内容 → 详情页可安全缓存。

## 二、分段方案

- **段 1 缓存头策略**：在 `worker/index.ts` 的 fetch 包装响应，按路径设置 Cache-Control：
  - 页面（`/`、`/poem/*`、`/collections/*`、`/authors*`、`/mengxue*`、`/poems`、`/favorites`）：`public, max-age=3600, s-maxage=86400`
  - `/api/poems`、`/api/poem/[id]`、`/api/poem/daily`：`public, max-age=60, s-maxage=300`（列表/搜索短缓存；daily 每天 URL 不变，5 分钟足够）
  - `/api/poem/random`：`no-store`（必须每次随机）
  - 仅对 `GET` 且 `status===200` 设置；其余保持原样
- **段 2 验证**：build + test + 推送部署；线上 curl 详情页两次检查 `CF-Cache-Status: HIT`，确认不查 D1。

## 三、文件清单

### 新建
| 文件 | 说明 | 状态 |
|---|---|---|
| `docs/LETTER-POETRY-PLAN-003-详情页CDN边缘缓存.md` | 本计划 | ✅ |

### 修改
| 文件 | 说明 | 状态 |
|---|---|---|
| `worker/index.ts` | 包装响应设置 Cache-Control | ⏳ |
| `AGENTS.md` | 缓存策略说明 | ⏳ |

## 四、实施顺序

1. 段 1（worker/index.ts 缓存头）→ 2. 段 2（build/test/部署/线上验证）

## 五、风险与应对

| 风险 | 应对 |
|---|---|
| CDN 缓存 404/错误页 | 仅对 status===200 设置缓存头 |
| 数据导入后旧缓存 | TTL 1 天自动过期；导入低频，可接受；如需立即生效可 purge（可选） |
| 动态内容被缓存（繁简切换） | 繁简切换是客户端渲染，HTML 相同，安全 |
| RSC/Accept 变体 | CDN 按 Vary 头分别缓存，正常 |

## 六、变更记录

| 日期 | 内容 |
|---|---|
| 2026-08-07 | 创建计划 |