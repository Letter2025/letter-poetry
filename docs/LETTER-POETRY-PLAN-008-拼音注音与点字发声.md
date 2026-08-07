# LETTER-POETRY-PLAN-008-拼音注音与点字发声

> 计划状态：⏳ 实施中 ｜ 创建日期：2026-08-07 ｜ 目标：正文拼音注音（全文注音模式 + 悬停拼音）+ 点击发声，零数据库改动

## 一、背景

用户希望「看到拼音 + 读出来」。选型：pinyin-pro（前端即时注音，多音字语境判断）+ SpeechSynthesis（点击发声，复用 TTS 能力）。**不需要改数据库**（拼音即时算，不存 D1）。

## 二、方案

- `components/annotated.tsx` 导出 `AnnotatedText`：
  - **全文注音模式**：开关切换，正文每个中文字用 `<ruby>` 上方小字拼音。
  - **悬停拼音**：普通模式下每个中文字 `title` 显示拼音（原生 tooltip）。
  - **点击发声**：点击中文字用 SpeechSynthesis 朗读该字。
  - 繁简兼容：先按当前脚本（opencc）转换文本再注音；`lang` 跟随。
  - pinyin-pro：`pinyin(text, { type: 'array', toneType: 'symbol' })`，字符与拼音 1:1（已验证标点原样、多音字语境）。
- 接入：详情页正文、蒙学长文（`PoemText` 替换为 `AnnotatedText`）。
- 样式：`.annot-char`（悬停/点击态）、`ruby rt` 注音小字。

## 三、文件清单

### 新建
| 文件 | 说明 | 状态 |
|---|---|---|
| `docs/LETTER-POETRY-PLAN-008-拼音注音与点字发声.md` | 本计划 | ✅ |
| `components/annotated.tsx` | 注音正文组件 | ⏳ |

### 修改
| 文件 | 说明 | 状态 |
|---|---|---|
| `app/poem/[id]/page.tsx` | 正文换 AnnotatedText | ⏳ |
| `app/mengxue/[id]/page.tsx` | 正文换 AnnotatedText | ⏳ |
| `app/globals.css` | 注音样式 | ⏳ |
| `package.json` | 依赖 pinyin-pro | ✅ |
| `AGENTS.md` / `.learnings` | 文档 | ⏳ |

## 四、实施顺序

1. AnnotatedText 组件 → 2. 接入详情页/蒙学 → 3. 构建/测试/部署 → 4. 线上验证（正文含 title 拼音与注音按钮）

## 五、风险与应对

| 风险 | 应对 |
|---|---|
| 繁体字拼音识别 | pinyin-pro 支持繁体；实现时验证「裏/發」等 |
| 多音字古诗破读（斜=xié） | 接受现代读音；后续可加小规则 |
| 点击发声与 TTS 冲突 | speakChar 先 cancel 再 speak |

## 六、变更记录

| 日期 | 内容 |
|---|---|
| 2026-08-07 | 创建计划 |