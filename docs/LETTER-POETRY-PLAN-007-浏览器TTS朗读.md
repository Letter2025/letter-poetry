# LETTER-POETRY-PLAN-007-浏览器TTS朗读

> 计划状态：✅ 全部完成 ｜ 创建日期：2026-08-07 ｜ 完成日期：2026-08-07 ｜ 目标：详情页/每日一诗/蒙学加「朗读」（浏览器 SpeechSynthesis），零服务器额度

## 一、背景

诗词站加「听诗」能力。选型：浏览器原生 Web Speech API（SpeechSynthesis）——零成本、无服务器额度、即时可用；云端 TTS（Workers AI/第三方）额度受限或付费，作为后续增强。

## 二、方案

- `components/tts-control.tsx`（客户端）：
  - 按钮：朗读 / 暂停 / 停止 + 语速（0.8× / 1× / 1.2×）
  - 中文语音：`getVoices()` 过滤 `lang` 以 `zh` 开头，`utterance.lang='zh-CN'`
  - 分段朗读：按行/标点切分为 ≤200 字符片段，逐个 `speak` 入队（规避浏览器单条长度限制）
  - 卸载/路由切换 `cancel()` 停止
- 接入：详情页（标题+作者+正文）、每日一诗卡片、蒙学详情（长文）。
- 样式：复用 `.button` + 少量 CSS。

## 三、文件清单

### 新建
| 文件 | 说明 | 状态 |
|---|---|---|
| `docs/LETTER-POETRY-PLAN-007-浏览器TTS朗读.md` | 本计划 | ✅ |
| `components/tts-control.tsx` | 朗读控制组件 | ⏳ |

### 修改
| 文件 | 说明 | 状态 |
|---|---|---|
| `app/poem/[id]/page.tsx` | 详情页加朗读 | ⏳ |
| `components/daily-poem.tsx` | 每日一诗加朗读 | ⏳ |
| `app/mengxue/[id]/page.tsx` | 蒙学长文加朗读 | ⏳ |
| `app/globals.css` | TTS 控制样式 | ⏳ |
| `AGENTS.md` / `.learnings` | 文档 | ⏳ |

## 四、实施顺序

1. tts-control 组件 → 2. 三处接入 → 3. 构建/测试/部署 → 4. 线上验证（页面含朗读控件；浏览器端交互）

## 五、风险与应对

| 风险 | 应对 |
|---|---|
| 无中文语音/浏览器不支持 | getVoices 过滤 zh，无则用 zh-CN 默认；不支持时按钮禁用 |
| 单条 utterance 过长 | 分段 ≤200 字符 |
| 路由切换继续朗读 | 组件卸载 cancel() |
| 服务器无法 curl 验证发声 | 验证页面含控件 + 组件逻辑测试 |

## 六、变更记录

| 日期 | 内容 |
|---|---|
| 2026-08-07 | 创建计划 |
| 2026-08-07 | 完成：TtsControl（朗读/暂停/停止/语速/中文语音/分段≤200字）；接入详情页、每日一诗（compact 听诗）、蒙学；esbuild 编译验证 splitText 分段与控件渲染；SSR 返回 null（客户端渲染，curl 不可见属正常） |