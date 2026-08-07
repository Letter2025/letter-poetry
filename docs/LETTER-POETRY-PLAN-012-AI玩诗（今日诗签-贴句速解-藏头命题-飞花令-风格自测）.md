# LETTER-POETRY-PLAN-012-AI玩诗（今日诗签-贴句速解-藏头命题-飞花令-风格自测）

> 计划状态：✅ 全部完成 ｜ 创建日期：2026-08-07 ｜ 完成日期：2026-08-07 ｜ 目标：在首页/策展页/独立页落地 5 个 AI 玩法，全部复用 /api/ai 三级回退链（PLAN-010/011），不重复造 LLM 调用

## 一、背景

详情页 AI（解析+询问）已上线。用户确认把 5 个策展页/首页 AI 功能全部做：
1. 首页「今日诗签」推荐语（每日一诗旁，结合季节/月份，联动 PLAN-009）
2. 策展页「AI 藏头诗 / 命题作诗」（标注 AI 生成）
3. 「AI 飞花令」（用户出字，AI 接句并给出处，可多轮）
4. 「诗词风格自测」（几步小问卷 → 判定偏好 + 推荐）
5. 首页「贴句速解」（贴任意一句 → AI 一句话解读，走 text 模式不查库）

## 二、方案

- **服务端**：扩展 `app/api/ai/route.ts`，新增 mode：`sign` / `create` / `feihua` / `quiz` / `quick`，每个 mode 有独立 system 提示词与输入组装/长度限制；仍走 `generateWithFallback` 三级回退，返回 `{ content, provider }`，`no-store`。
- **客户端工具**：`lib/use-ai.ts`（"use client"）导出 `callAi(body)` 统一 fetch 封装。
- **组件/页面**：
  - `components/sign-card.tsx`：嵌入 `daily-poem.tsx` 的每日一诗卡片，「AI 今日推荐语」按钮 → 按当前月份/季节生成推荐语。
  - `components/quick-explain.tsx`：首页「贴句速解」输入框 → 一句话解读。
  - `components/ai-create.tsx`：策展页「AI 藏头诗 / 命题作诗」，输入主题或藏头字 → 即兴创作（标注 AI 生成）。
  - `components/feihua.tsx` + `app/feihua/page.tsx`：飞花令（出字 → AI 接句 + 出处；前端保留多轮历史）。
  - `components/style-quiz.tsx` + `app/quiz/page.tsx`：风格自测（5 道单选 → AI 判定 + 推荐）。
- **导航**：`components/chrome.tsx` nav 加「飞花令」「风格自测」入口。
- **样式**：复用 `.ai-panel/.ai-output/.button` 等，新增少量 `.ai-*` 区块样式（复用设计令牌）。
- 首页布局：今日诗签在每日一诗卡片内；贴句速解独立 section（放 SeasonPick 之后）。

## 三、文件清单

### 新建
| 文件 | 说明 | 状态 |
|---|---|---|
| `docs/LETTER-POETRY-PLAN-012-AI玩诗（今日诗签-贴句速解-藏头命题-飞花令-风格自测）.md` | 本计划 | ✅ |
| `lib/use-ai.ts` | 客户端 callAi 封装 | ✅ |
| `components/sign-card.tsx` | 今日诗签 | ✅ |
| `components/quick-explain.tsx` | 贴句速解 | ✅ |
| `components/ai-create.tsx` | 藏头/命题作诗 | ✅ |
| `components/feihua.tsx` | 飞花令 | ✅ |
| `components/style-quiz.tsx` | 风格自测 | ✅ |
| `app/feihua/page.tsx` | 飞花令页 | ✅ |
| `app/quiz/page.tsx` | 风格自测页 | ✅ |

### 修改
| 文件 | 说明 | 状态 |
|---|---|---|
| `app/api/ai/route.ts` | 新增 5 个 mode + 提示词 | ✅ |
| `components/daily-poem.tsx` | 嵌入 SignCard | ✅ |
| `app/page.tsx` | 首页加贴句速解 section | ✅ |
| `app/themes/page.tsx` | 策展页加 AiCreate | ✅ |
| `components/chrome.tsx` | 导航加飞花令/风格自测 | ✅ |
| `app/globals.css` | 新样式 | ✅ |
| `AGENTS.md` / `.learnings` | 文档 | ✅ |

## 四、实施顺序

1. route.ts 扩展（5 mode）→ 2. lib/use-ai.ts → 3. 各组件/页面 → 4. 首页/策展/导航接入 → 5. 构建/测试 → 6. 推送部署 → 7. 线上验证（5 个 mode 逐一 curl）

## 五、风险与应对

| 风险 | 应对 |
|---|---|
| 飞花令 AI 编造诗句 | system 强约束「只接真实存在的诗句」；前端提示仅供参考 |
| 藏头诗/命题质量不稳定 | 标注「AI 创作，仅供参考」；mode 独立提示词 |
| 各 mode 输入超限 | 统一长度校验（extra/text/question 分级限制） |
| 导航项过多 | 飞花令/自测并入 nav；移动端折叠菜单不受影响 |
| 免费额度消耗 | 全部用户主动触发；sign/quick 轻量 |

## 六、变更记录

| 日期 | 内容 |
|---|---|
| 2026-08-07 | 创建计划 |
| 2026-08-07 | 完成：7 mode 扩展 + lib/use-ai.ts + 5 组件/2 页面/首页/策展/导航接入；线上验证：sign（结合 8 月夏季推荐语）/create（藏头诗）/feihua（5 句+出处）/quiz/quick 全部返回，4 页面 200 |
