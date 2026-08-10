# LETTER-POETRY-PLAN-013-诗河星图（三维漫游）

> 计划状态：✅ 全部完成 ｜ 创建日期：2026-08-10 ｜ 完成日期：2026-08-10 ｜ 目标：新增 `/river` 三维「诗河」页面，把 47,629 首真实诗化作河灯，沿朝代之河从《诗经》源头流向明清（「君不见黄河之水天上来」）

## 一、背景

- 用户调研诗云（Cohenjikan/shiyun）后，选定「诗河」作为 letter-poetry 的三维差异化展现：诗云是**空间银河 + 虚空噪声诗**（97 万首的「广」），我们做**时间之河 + 全部真实诗**（4.7 万首的「精」）。
- letter-poetry 现有 47,629 首真实诗（2,390 作者 / 13 选集，全唐诗 44,020 最盛），数据在 D1，构建期元数据在 `public/data/*.json`（已提交，CI 沿用）。
- **许可边界**：诗云代码 PolyForm Noncommercial，本项目仅借鉴「星图漫游」交互概念，代码、数据、字库全部自研；three.js（MIT）可用。

## 二、方案

- **页面**：新增 `/river`（server 组件壳 + 客户端 3D 场景）。
- **河道**：XZ 平面一条蜿蜒曲线（CatmullRom），朝代按时间排序成 9 段（先秦→战国→汉末→唐→五代→宋→元→明→清），t 区间等分；段内每首诗按 id 哈希散布，Y 轴微起伏成波光。
- **河灯**：47,629 个 `THREE.Points`（additive blending + Canvas 圆光 sprite 纹理），颜色按朝代映射 Letter 设计令牌色板；全唐诗段密度最高 → 盛唐最亮（自然的时代盛衰叙事）。
- **航标**：每朝代一个光球 + Canvas 文字 Sprite 标签（诗经源流 / 盛唐 / 两宋 / 明清…）。
- **交互**：OrbitControls（拖拽旋转 / 滚轮缩放 / 触控）；点击河灯 → Raycaster 拾取 → 诗卡（编号、标题、作者、选集 tag、跳转 `/poem/[id]`）；hover 节流 150ms 显示标题。
- **HUD**：LETTER POETRY · 诗河航图；朝代 legend（点击飞到该段）；「顺流入海 / 逆流溯源 / 随机一盏灯」；`READY` 状态灯 + 47,629 盏河灯统计。
- **降级**：WebGL 不可用 → 提示 + 链接 `/poems`；`prefers-reduced-motion` 减弱动画。
- **数据**：`scripts/build-data.mjs` 追加生成 `public/data/river.json`（`{id,t,a,c}` × 47,629，提交仓库；CI 无数据源时沿用提交产物）。
- **部署**：push main → CI（npm ci + build + test + wrangler deploy）自动上线；页面已挂分析脚本（layout 全局）。

## 三、文件清单

### 新建
| 文件 | 说明 | 状态 |
|---|---|---|
| `docs/LETTER-POETRY-PLAN-013-诗河星图（三维漫游）.md` | 本计划 | ✅ |
| `app/river/page.tsx` | 诗河页（server：metadata + Header + Scene + Footer） | ✅ |
| `components/river-scene.tsx` | 诗河 3D 场景（client，three.js） | ✅ |
| `tests/river-data.test.mjs` | river.json 冒烟测试（数量/字段/id 唯一） | ✅ |

### 修改
| 文件 | 说明 | 状态 |
|---|---|---|
| `scripts/build-data.mjs` | 追加生成 river.json | ✅ |
| `public/data/river.json` | 构建产物（提交，CI 沿用） | ✅ |
| `components/chrome.tsx` | 导航加「诗河」 | ✅ |
| `app/page.tsx` | 首页加入口卡 | ✅ |
| `app/globals.css` | 诗河样式段（复用设计令牌） | ✅ |
| `package.json` / `package-lock.json` | 新增 three / @types/three | ✅ |
| `AGENTS.md` | 目录结构 / 开发规则补充 | ✅ |
| `.learnings/LEARNINGS.md` | 沉淀 | ✅ |

## 四、实施顺序

1. 写 PLAN → 2. `npm install three @types/three` → 3. build-data 生成 river.json（本机跑，检查 diff）→ 4. `river-scene.tsx` + `/river` 页面 → 5. 导航 / 首页入口 → 6. globals.css 样式 → 7. 测试 + 构建 → 8. push 部署 → 9. 线上验证

## 五、风险与应对

| 风险 | 应对 |
|---|---|
| three 增大客户端 bundle | 仅客户端 dynamic import（ssr:false），不进服务端/RSC bundle；3MB 上限针对服务端 JS，three 进独立 client chunk |
| 4.7 万点拾取性能 | Points 点击单次 Raycaster O(n) 可接受；hover 节流 150ms；不够再上 GPU color-id picking（后续） |
| CI 无数据源 | river.json 提交进仓库，CI `build-data` 直接沿用退出 |
| WebGL 不支持 / 弱 GPU | try/catch 降级提示 + `/poems` 入口；`prefers-reduced-motion` 减动画 |
| 主题适配 | 3D 场景固定深色星空（沉浸式页面惯例），页面 chrome 跟随 `data-theme` |
| 许可风险 | 全部自研，不引入诗云源码/字库/数据 |

## 六、变更记录

- 2026-08-10：创建计划，开始实施。
- 2026-08-10：实现完成并上线（CI 部署 poetry.myletter.top/river，SSR/静态资源/入口均验证通过），收尾 AGENTS.md + LEARNINGS。
- 2026-08-10：上线后用户反馈「不好看 / 无河感 / 点击无反应」→ v2 迭代（UnrealBloom 泛光 + 水流光带 2400 点 + 名人金色大灯 + raycaster threshold 1→3.2 修点击）；v3 再迭代（河灯 size 0.62→3.4 / 名人→5.0、河床 TubeGeometry 半透明河面、实心光点纹理、相机 -70,128,210→-50,95,150 拉近、bloom 1.15→1.6）。headless Edge 像素网格验证：亮带呈蜿蜒河形（bright 0.5%→1.5%、mid 0.8%→4.9%），点击/悬停/随机灯均命中真实诗。
