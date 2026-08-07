# LETTER-POETRY-PLAN-011-AI三级回退链（智谱-硅基流动-WorkersAI）

> 计划状态：✅ 全部完成 ｜ 创建日期：2026-08-07 ｜ 完成日期：2026-08-07 ｜ 目标：把 letter-poetry 的 /api/ai 从「单智谱 key」升级为 letter-ask 同款三级回退链（智谱 GLM → SiliconFlow 免费对话模型 → Cloudflare Workers AI 兜底），提升免费模型限流/波动下的稳定性

## 一、背景

letter-poetry 详情页 AI（PLAN-010）当前只调智谱单一模型（glm-4.7-flash，免费档约 1 并发），限流/网络波动时直接 502。letter-ask 已验证的三级回退链（src/rag.ts，2026-08-07 部署通过）可复用：模型池按序尝试 + 指数退避重试 + Provider 逐级回退。

## 二、方案

- 新建 `lib/llm.ts`（服务端，移植 letter-ask rag.ts 的非流式部分）：
  - `generateWithFallback({ system, user })` 统一入口，返回 `{ content, provider }`。
  - ① 智谱模型池：`glm-4.7-flash,glm-4-flash-250414`（thinking disabled，max_tokens 4096，指数退避 ≤2 次，失败切下一模型）。
  - ② SiliconFlow 模型池：`THUDM/GLM-Z1-9B-0414,tencent/Hunyuan-MT-7B`（max_tokens 4096；**仅当 env.SILICONFLOW_API_KEY 存在才启用**，无 key 自动跳过）。
  - ③ Cloudflare Workers AI 兜底：`@cf/openai/gpt-oss-20b`（env.AI.run，max_tokens 4096；免费 10K neurons/天）。
  - 回退链固定 zhipu → siliconflow → workers-ai。
- `app/api/ai/route.ts`：改用 lib/llm.ts，返回 `{ content, provider }`。
- `vite.config.ts`：localBindingConfig 加 `ai: { binding: "AI" }`。
- env 类型声明（lib/db.ts）：加 `ZHIPU_API_KEY`、`SILICONFLOW_API_KEY`、`AI`。
- Secret：ZHIPU_API_KEY 已有；SILICONFLOW_API_KEY 待用户提供后设置（缺 key 时硅基流动级自动跳过）。
- 前端 AiPanel 提示文案改「由 AI 生成 · 仅供参考」（不再固定写智谱）。

## 三、文件清单

### 新建
| 文件 | 说明 | 状态 |
|---|---|---|
| `docs/LETTER-POETRY-PLAN-011-AI三级回退链（智谱-硅基流动-WorkersAI）.md` | 本计划 | ✅ |
| `lib/llm.ts` | 三级回退链（zhipu/siliconflow/workers-ai） | ✅ |

### 修改
| 文件 | 说明 | 状态 |
|---|---|---|
| `app/api/ai/route.ts` | 改用 lib/llm.ts，返回 provider | ✅ |
| `vite.config.ts` | 加 AI binding | ✅ |
| `lib/db.ts` | env 声明加 key 与 AI | ✅ |
| `components/ai-panel.tsx` | 提示文案去「智谱」字样 | ✅ |
| `AGENTS.md` / `.learnings` | 文档 | ✅ |

## 四、实施顺序

1. lib/llm.ts → 2. route.ts 接入 → 3. vite.config.ts AI binding + env 声明 → 4. 构建/测试 → 5. 推送部署 → 6. 线上验证（智谱链路 + Workers AI 兜底链路）→ 7. （用户提供 key 后）设置 SILICONFLOW_API_KEY 验证硅基流动链路

## 五、风险与应对

| 风险 | 应对 |
|---|---|
| SILICONFLOW_API_KEY 未配置 | 回退链自动跳过该级（`env.SILICONFLOW_API_KEY` 判断），不影响智谱/Workers AI |
| Workers AI 免费额度（10K neurons/天） | 仅作兜底，主链路智谱；额度低时仍比 502 好 |
| 模型名/免费策略变化 | 模型列表集中常量，失败自动切下一模型/下一 Provider |
| 输出被 max_tokens 截断 | 统一 4096（letter-ask 同款）；解析提示词已限 500 字 |
| 部署配置不含 AI binding | vite.config.ts 加 ai binding，部署配置自动生成 |

## 六、变更记录

| 日期 | 内容 |
|---|---|
| 2026-08-07 | 创建计划；参照 letter-ask src/rag.ts（generateOnce 三级回退）移植 |
| 2026-08-07 | 完成：lib/llm.ts 三级回退（智谱模型池→硅基流动→Workers AI 兜底）+ /api/ai 接入 + AI binding + env 声明；验证：智谱链路 provider=zhipu:glm-4.7-flash ✅；临时置无效智谱 key 实测回退 workers-ai:@cf/openai/gpt-oss-20b（1255 字）✅ 恢复后智谱正常 ✅ |
| 2026-08-07 | 坑：gpt-oss-20b 经 env.AI.run 返回 OpenAI 兼容格式 choices[0].message.content（非 letter-ask 假设的 response），已兼容双格式；secret 变更传播约 60s |
| 2026-08-07 | SILICONFLOW_API_KEY 已配置（wrangler secret bulk）；实测 zhipu 失效 → siliconflow:THUDM/GLM-Z1-9B-0414 正常（1862 字），恢复后 zhipu 正常；三级回退链全部链路验证完毕 |
