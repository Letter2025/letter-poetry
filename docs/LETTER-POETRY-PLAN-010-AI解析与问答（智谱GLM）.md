# LETTER-POETRY-PLAN-010-AI解析与问答（智谱GLM）

> 计划状态：✅ 全部完成 ｜ 创建日期：2026-08-07 ｜ 完成日期：2026-08-07 ｜ 目标：详情页接入智谱 glm-4.7-flash 免费模型，提供「AI 解析」与「向 AI 询问」两个能力；API Key 只存 Cloudflare Secret，不进 git/前端

## 一、背景

站点已有全文/选集/作者/策展等浏览维度，缺「解读」能力。用户希望接入智谱免费模型（已确认用 **glm-4.7-flash**，实测可用），在**详情页**提供：一键 AI 解析（背景/逐句释义/赏析/名句）与自由问答（结合当前诗文）。首页/策展页的 AI 附加能力另行规划（见变更记录），不与详情页重复。

## 二、方案

- **服务端代理** `POST /api/ai`（route handler，`force-dynamic`，`no-store`，不进 CDN 缓存）：
  - 入参：`{ id?: string; text?: string; question?: string; mode: "explain" | "ask" }`；有 `id` 时服务端从 D1 取诗文，否则用传入 `text`（限量）。
  - 校验：`mode` 合法；`question` ≤ 300 字；`text` ≤ 2000 字。
  - 调智谱 OpenAI 兼容接口 `https://open.bigmodel.cn/api/paas/v4/chat/completions`：
    `Authorization: Bearer ${env.ZHIPU_API_KEY}`、`model: "glm-4.7-flash"`、system 提示词 + user 内容、`max_tokens` 1024。
  - Key **只存 Secret**（`wrangler secret put ZHIPU_API_KEY`），代码只读 `env.ZHIPU_API_KEY`，绝不写死/进 bundle。
- **详情页 AI 面板** `components/ai-panel.tsx`（客户端）：
  - 「AI 解析」按钮：输出 背景 / 逐句释义 / 赏析 / 名句（如适用），结构化分段。
  - 「向 AI 询问」输入框：默认附当前诗文，回答结合诗文；输入 ≤300 字。
  - 结果区 `white-space: pre-line` 纯文本渲染；加载态/错误态/长度校验。
- **CSS**：复用设计令牌，新增 `.ai-panel` 等少量样式（panel 风格与 `.poem-note` 一致）。
- 每次调用为独立请求（无会话状态）；错误时返回友好提示（含 429 限流提示）。

## 三、文件清单

### 新建
| 文件 | 说明 | 状态 |
|---|---|---|
| `docs/LETTER-POETRY-PLAN-010-AI解析与问答（智谱GLM）.md` | 本计划 | ✅ |
| `app/api/ai/route.ts` | AI 代理 API（POST，服务端调智谱） | ✅ |
| `components/ai-panel.tsx` | 详情页 AI 面板（解析 + 询问） | ✅ |

### 修改
| 文件 | 说明 | 状态 |
|---|---|---|
| `app/poem/[id]/page.tsx` | 详情页挂载 AiPanel | ✅ |
| `lib/db.ts` | `cloudflare:workers` env 声明加 `ZHIPU_API_KEY` | ✅ |
| `app/globals.css` | AI 面板样式 | ✅ |
| `AGENTS.md` / `.learnings` | 文档 | ✅ |

## 四、实施顺序

1. route.ts（env 声明 + 智谱调用 + 校验/错误处理）→ 2. ai-panel.tsx → 3. 详情页挂载 + CSS → 4. `wrangler secret put ZHIPU_API_KEY` → 5. 构建/测试 → 6. 推送部署 → 7. 线上验证（workers.dev 直连 POST）

## 五、风险与应对

| 风险 | 应对 |
|---|---|
| key 泄露（写进 git/前端） | key 只进 Secret；代码只读 env；.gitignore 不含 key |
| 模型名变更/免费额度变化 | model 常量集中；失败返回友好错误 |
| 免费模型限流（429） | 前端提示「服务繁忙/额度限制」，不阻塞页面 |
| 用户输入注入 | 输入作为普通文本消息，system 固定；长度上限；不做 markdown 渲染（纯文本） |
| CDN 缓存 AI 响应（含用户输入） | route 显式 `Cache-Control: no-store`，worker 只缓存页面 HTML 非 /api 路径 |

## 六、变更记录

| 日期 | 内容 |
|---|---|
| 2026-08-07 | 创建计划；智谱 key 实测有效，glm-4.7-flash 返回正常 |
| 2026-08-07 | 完成：/api/ai（explain/ask）+ AiPanel + 详情页挂载 + Secret（bulk 重建）；线上踩坑：glm-4.7-flash 默认思考会吃满 max_tokens 致 content 为空 → 加 thinking:{type:disabled}；验证：explain/ask 均正常返回，详情页 SSR 含面板，主域 200 |
| 2026-08-07 | 待办：首页/策展页 AI 附加能力候选（今日诗签 / 飞花令 / 命题藏头诗 / 风格自测），用户确认后另立 PLAN |