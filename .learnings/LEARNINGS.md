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
2026-08-07 | 首页/策展页 AI 附加能力（今日诗签/飞花令/命题藏头诗/风格自测） | 待用户确认后另立 PLAN

## LEARNINGS
（记录每次任务完成后的经验沉淀，格式：日期 | 主题 | 结论）
2026-08-07 | 繁简转换选型 | chinese-conv 的 tify 会把「千里」误转「千裡」；opencc-js Converter({from:"cn",to:"t"}) 对 里/裏、鐘/鍾、髮/發 均正确，客户端可用且已在依赖
2026-08-07 | vinext 产物结构 | dist/server/wrangler.json 是部署配置（CI --config 指向它）；public 静态资源复制到 dist/client；静态路由由运行时预渲染，构建日志中 ƒ Dynamic 不代表不可用
2026-08-07 | 数据驱动页面 | 作者页/收藏页/全文检索均改为构建期生成数据（authors.json/full.json），避免运行时计算与多请求拉取
2026-08-07 | PowerShell 中文传输 | @'...'@ | node - 会损坏中文（变 ?）；涉及中文的脚本一律 WriteAllText 写临时文件再执行
2026-08-07 | AI 接入（智谱 GLM） | glm-4.7-flash 实测可用（open.bigmodel.cn/api/paas/v4/chat/completions，OpenAI 兼容）；key 只存 wrangler secret（put ZHIPU_API_KEY），代码读 env.ZHIPU_API_KEY；route 必须 force-dynamic + no-store（响应含用户输入，不进 CDN 缓存）；前端纯文本渲染防注入
2026-08-07 | 智谱 glm-4.7-flash 思考模式 | 默认启用 reasoning，max_tokens=1024 会被思考内容占满 → finish_reason=length 且 content 为空（线上曾返回「AI 返回为空」）；必须传 thinking:{type:"disabled"} 才直接输出 content，且更省 token（实测同题 624 vs 1522+）
2026-08-07 | 三级回退链移植 | letter-ask src/rag.ts 的 generateOnce 模式（模型池 + 指数退避 ≤2 + Provider 逐级回退 zhipu→siliconflow→workers-ai）可直接移植到其他站；Workers AI 兜底需在 vite.config.ts 加 ai:{binding:"AI"}（vite plugin config 即 wrangler Unstable_Config 子集，部署配置自动生成）；SILICONFLOW_API_KEY 缺省时回退链自动跳过该级
2026-08-07 | Workers AI gpt-oss-20b 响应格式 | env.AI.run(@cf/openai/gpt-oss-20b) 返回 OpenAI 兼容格式 {choices:[{message:{content}}]}，不是 {response}（letter-ask 的 res.response 假设会拿空）；解析需 choices[0].message.content 优先、response 兜底；REST 实测 success=True、约 6 neurons/次（10K/天免费）
2026-08-07 | 硅基流动链路启用 | SILICONFLOW_API_KEY 已配置（wrangler secret bulk）；实测回退链 zhipu 失效 → siliconflow:THUDM/GLM-Z1-9B-0414 正常返回 1862 字；GLM-Z1 思考型首 token 慢（5-6s），max_tokens 已给 4096；智谱多分支并发易限流时硅基流动是关键备选
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
## TTS-2026-08-07（浏览器朗读）
- SpeechSynthesis：`speak/pause/resume/cancel` + `getVoices()` 过滤 zh + `rate`；单条 utterance 有长度限制 → splitText 按标点切分为 ≤200 字片段逐个入队。
- 客户端组件 SSR 返回 null（`typeof window` 检查），curl 看不到控件属正常；验证用 esbuild 编译真实组件 + mock window/speechSynthesis + React 渲染。
- 零服务器额度；云端 TTS（Workers AI MeloTTS）作后续增强。
## PINYIN-2026-08-07（拼音注音）
- pinyin-pro `pinyin(text, {type:'array', toneType:'symbol'})`：字符与拼音 1:1（标点原样），多音字按语境，繁体字读音正确（裏=lǐ、髮=fà）。
- AnnotatedText：全文注音模式（ruby/rt）+ 悬停 title 拼音 + 点击 SpeechSynthesis 发声；繁简兼容（opencc 先转再注音）。
- 经验：判断线上是否部署新代码前先确认该 commit 的 CI run（per_page=1 可能拿到旧 run）；部署传播有 ~1 分钟延迟；详情页被 worker/CDN 缓存，新功能验证用 `?x=` 参数绕过。
## CURATION-2026-08-07（主题/季节策展）
- themes.json：4 季节 + 6 主题（67 篇精选），脚本 scripts/build-themes.mjs 连 D1 按 title LIKE + author 匹配真实 id；静态提交（lib/generated + public/data）。
- 局限：库内无宋诗/全宋词/陶渊明，精选只取库内（唐诗+12选集）。
- 首页当季推荐 SeasonPick：客户端按月份（Asia/Shanghai）选季节，fetch themes.json + /api/poems?ids= 显示 3 首。
- 经验：curl 输出经 PowerShell 变量 join 后 Contains 判断曾误报 False，改用保存文件 + ReadAllText 判断更可靠；CI run 判断务必核对 head_sha。