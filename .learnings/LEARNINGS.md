# LETTER-POETRY · Learnings

## ERRORS
（按时间记录本仓库遇到的错误与修复，格式：日期 | 错误 | 根因 | 修复）
2026-08-07 | npm test 失败（tests/ 不存在） | test 脚本指向缺失文件且 CI 未跑测试 | 新增 tests/rendered-html.test.mjs（数据+产物冒烟），deploy.yml 加 npm test
2026-08-07 | 删除 .openai/hosting.json 后 build 失败 | vite.config.ts 的 Sites 模板 import 该文件（d1/r2 绑定读取） | 撤销删除，保留 hosting.json；结论：Codex Sites 模板项目此文件不是残留
2026-08-07 | build-data.mjs 补丁多次转义错误 | PowerShell here-string 经管道传 node 中文变 ?；模板字符串中 \" 被求值 | 用临时 .cjs 文件（WriteAllText UTF-8）+ 纯 ASCII 替换；复杂转义用 .NET ReadAllText/Replace 直接修文件

## FEATURE REQUESTS
（记录待办功能与改进想法，格式：日期 | 需求 | 状态）
2026-08-07 | 全文检索服务端化（route handler / Worker API） | 未做（vinext 对 route handler 支持未验证；当前 full.json 单文件方案已够）
2026-08-07 | 收藏跨设备同步（D1/账号） | 未做（当前 localStorage 本机收藏，README 已如实说明）

## LEARNINGS
（记录每次任务完成后的经验沉淀，格式：日期 | 主题 | 结论）
2026-08-07 | 繁简转换选型 | chinese-conv 的 tify 会把「千里」误转「千裡」；opencc-js Converter({from:"cn",to:"t"}) 对 里/裏、鐘/鍾、髮/發 均正确，客户端可用且已在依赖
2026-08-07 | vinext 产物结构 | dist/server/wrangler.json 是部署配置（CI --config 指向它）；public 静态资源复制到 dist/client；静态路由由运行时预渲染，构建日志中 ƒ Dynamic 不代表不可用
2026-08-07 | 数据驱动页面 | 作者页/收藏页/全文检索均改为构建期生成数据（authors.json/full.json），避免运行时计算与多请求拉取
2026-08-07 | PowerShell 中文传输 | @'...'@ | node - 会损坏中文（变 ?）；涉及中文的脚本一律 WriteAllText 写临时文件再执行
## ARCHITECTURE-2026-08-07（架构升级）
- D1 rows_written 免费 10 万/天，按「行 + 索引」计费：普通 INSERT 1 行 + 主键索引 1 = 2/首；多列索引 4/首；FTS5 ≈5/首 → 中文搜索不能建 FTS，用 LIKE（D1 端执行不占 Worker CPU，3 万行 2ms）。
- D1 不支持 SQL BEGIN/COMMIT（用 API 事务）；单条语句长度 <54KB（按 40KB 字节分批）。
- vinext 支持 `import { env } from "cloudflare:workers"` 在 server component / route handler 用 D1；binding 写在 vite.config.ts cloudflare plugin config，自动进 dist/server/wrangler.json。
- 动态页用 `export const dynamic = "force-dynamic"` 避免 build 时执行 D1 查询。
- 免费版 bundle 压缩 3MB：数据必须移出 bundle；客户端组件 import 服务端模块用 `import type` 隔离。
## OG-2026-08-07（动态分享卡片图）
- Cloudflare Workers 禁止动态编译/实例化任意 WASM bytes：@vercel/og 的 resvg 运行时加载失败（返回 200 空 body / 500 空 body）。正解：`import wasm from "x.wasm?module"` 静态导入（wrangler 预编译）+ `initWasm(wasmModule)`。
- satori 字体解析基于 opentype.js，**不支持 woff2**（报 Unsupported OpenType signature wOF2），必须 ttf/otf。
- 中文 ttf 来源：`@expo-google-fonts/noto-sans-sc`（NotoSansSC_400Regular.ttf，8.5MB，jsdelivr CDN）；运行时加载 + 模块级缓存 + 重试。
- 本方案 bundle gzip 0.84MB（免费 3MB 内）；OG 图带 Cache-Control 1 天。
## SITEMAP-2026-08-07（sitemap 分页）
- 方案：/sitemap.xml（sitemap index）→ /sitemap-static.xml（精选，bundle 数据）+ /sitemap/1..N（详情分页，D1 每页 10,000 条）。
- 4.7 万首 → 5 页（第 5 页 7,629）；/sitemap/6 返回 404（超出）。
- 替换旧 app/sitemap.ts 时，旧 /sitemap.xml 被 CDN 缓存（s-maxage 86400）约 1 天过渡；token 无 purge_cache 权限（zone 级受限），只能等 TTL 或换 URL。
- robots.txt 是 Cloudflare Managed（含 Content-Signal），自定义部分（sitemap 指向）在文件尾部生效。
## SEARCH-2026-08-07（搜索体验优化）
- API 命中行：text 命中的诗返回 hit（含关键词的前 2 行）；title/author 命中不返回（列表已展示）。
- 相关性排序 SQL：`ORDER BY CASE WHEN title LIKE 'q%' THEN 0 WHEN title LIKE '%q%' THEN 1 WHEN author LIKE '%q%' THEN 2 ELSE 3 END, id`。
- 前端高亮：Highlight 组件（split + <mark>，非正则安全；React 自动转义）。
- 经验：主域名 /api 可能命中 CDN 旧缓存（no-store 也偶发），判断新旧代码用 workers.dev 直连；客户端渲染的 mark 用 curl 看不到，需浏览器或 React renderToStaticMarkup 验证。