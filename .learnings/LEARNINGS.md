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