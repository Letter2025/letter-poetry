# LETTER-POETRY-PLAN-006-搜索体验优化

> 计划状态：⏳ 实施中 ｜ 创建日期：2026-08-07 ｜ 目标：搜索命中行高亮 + 相关性排序，提升检索体验

## 一、背景

当前 /poems 搜索：全库 LIKE（title/author/text），结果按 id 排序，列表只显示「标题 + 首行」。问题：
- 首行未必是命中句（搜「明月」显示的是诗首行，而非含「明月」的句子）；
- 结果顺序与相关性无关（正文命中和标题命中混排）。

## 二、方案

- **命中行**：API 对 text 命中的诗返回 `hit`（正文中含 q 的第一行，最多 2 行）；title/author 命中不额外返回（列表已展示）。
- **高亮**：前端把 q 在 `hit` 文本中高亮为 `<mark>`（安全 split/join，不用正则）。
- **相关性排序**：SQL `ORDER BY CASE WHEN title LIKE 'q%' THEN 0 WHEN title LIKE '%q%' THEN 1 WHEN author LIKE '%q%' THEN 2 ELSE 3 END, id`（标题前缀 > 标题包含 > 作者 > 正文）。
- 应用范围：/poems 全局搜索 + /collections 选集内搜索（collection-browser）。

## 三、文件清单

### 新建
| 文件 | 说明 | 状态 |
|---|---|---|
| `docs/LETTER-POETRY-PLAN-006-搜索体验优化.md` | 本计划 | ✅ |

### 修改
| 文件 | 说明 | 状态 |
|---|---|---|
| `lib/db.ts` | searchPoems 排序 + 计算 hit | ⏳ |
| `app/poems/page.tsx` | 命中高亮展示 | ⏳ |
| `components/collection-browser.tsx` | 命中高亮展示 | ⏳ |
| `tests/rendered-html.test.mjs` | 可选：hit 逻辑断言 | ⏳ |
| `AGENTS.md` / `.learnings` | 文档 | ⏳ |

## 四、实施顺序

1. db.ts（排序 + hit）→ 2. 前端高亮 → 3. 构建/测试/部署 → 4. 线上验证（搜「明月」看命中行与高亮）

## 五、风险与应对

| 风险 | 应对 |
|---|---|
| q 含 HTML/正则字符导致注入 | 高亮用 split/join（非正则）；React 默认转义文本 |
| hit 行多行展示过长 | 最多 2 行，前端截断 |

## 六、变更记录

| 日期 | 内容 |
|---|---|
| 2026-08-07 | 创建计划 |