import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sify } from "chinese-conv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.resolve(ROOT, "..", "cf-poetry-data");
const OUT = path.join(ROOT, "public", "data");
// 数据源不存在时（如 CI 环境），使用已提交的生成数据，跳过重新生成。
if (!fs.existsSync(SRC)) {
  const meta = path.join(OUT, "collections-meta.json");
  const gen = path.join(ROOT, "lib", "generated", "mengxue.json");
  if (!fs.existsSync(meta) || !fs.existsSync(gen)) {
    console.error("[build-data] 缺少数据源目录，且没有已提交的生成数据。");
    process.exit(1);
  }
  console.log("[build-data] 数据源目录不存在，沿用已提交的生成数据。");
  process.exit(0);
}



function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(SRC, rel), "utf8"));
}
function clean(s) {
  return (s ?? "").toString().replace(/\s+/g, " ").trim();
}
function simp(s) {
  try { return sify(clean(s)); } catch { return clean(s); }
}
function toLines(input) {
  if (Array.isArray(input)) return input.map(clean).filter(Boolean);
  const s = clean(input);
  if (!s) return [];
  return s.split(/(?<=[，。？！；：、])/).map((x) => clean(x)).filter(Boolean);
}
function stripDynasty(a) {
  return clean(a)
    .replace(/^[（(]?(唐|宋|元|明|清|五代|先秦|汉|三国|晋|南北朝|隋|辽|金|民国)[）)]?[：: ]?/, "")
    .replace(/[（(](唐|宋|元|明|清|五代|先秦|汉|三国|晋|南北朝|隋|辽|金|民国)[）)]/g, "");
}


// [LETTER-POETRY-PLAN-001#1] Asia/Shanghai 本地日期（YYYY-MM-DD），避免 UTC 日期偏差
function localDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function xmlEscape(s) {
  return (s ?? "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function poemFirstLine(id) {
  const key = id.split("-")[0];
  const list = colData[key] || [];
  const item = list.find((x) => x.id === id);
  return item ? item.p[0] || "" : "";
}
// [LETTER-POETRY-PLAN-001#1] 静态 RSS（每日一诗 + 每部选集一篇 + 蒙学各篇）
function buildRss(index, mengxueDocs) {
  const site = "https://poetry.myletter.top";
  const ymd = localDate().replace(/-/g, "");
  const dailyMeta = index.poems[parseInt(ymd, 10) % index.poems.length];
  const entries = [];
  entries.push({ title: "每日一诗：《" + dailyMeta.t + "》· " + (dailyMeta.a || "佚名"), link: site + "/poem/" + dailyMeta.id, desc: poemFirstLine(dailyMeta.id) });
  for (const c of index.collections) {
    const list = colData[c.key] || [];
    if (list[0]) entries.push({ title: "《" + list[0].t + "》· " + (list[0].a || "佚名") + "（" + c.name + "）", link: site + "/poem/" + list[0].id, desc: list[0].p[0] || "" });
  }
  const seenMeng = new Set();
  for (const d of mengxueDocs) {
    const group = d.id.startsWith("guwen-") ? "guwen" : d.id;
    if (seenMeng.has(group)) continue;
    seenMeng.add(group);
    entries.push({ title: "《" + d.title + "》· " + (d.author || "佚名") + "（蒙学）", link: site + "/mengxue/" + d.id, desc: (d.paragraphs[0] || "").slice(0, 60) });
  }
  const itemsXml = entries.map((e) => "<item><title>" + xmlEscape(e.title) + "</title><link>" + xmlEscape(e.link) + "</link><guid isPermaLink=\"true\">" + xmlEscape(e.link) + "</guid><description>" + xmlEscape(e.desc) + "</description></item>").join("\n");
  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<rss version=\"2.0\"><channel><title>Letter Poetry｜古典诗文档案</title><link>" + site + "</link><description>唐诗、宋词、诗经、楚辞与蒙学经典的在线诗文集</description><language>zh-CN</language><lastBuildDate>" + new Date().toUTCString() + "</lastBuildDate>" + itemsXml + "</channel></rss>";
}

const collectionsMeta = [];
const poems = [];
const colData = {};

function addCollection(key, name, short, dynasty, desc, rows, pad = 3) {
  const list = rows.filter((r) => r.p && r.p.length > 0 && clean(r.t));
  const withIds = list.map((r, i) => ({ id: key + "-" + String(i + 1).padStart(pad, "0"), ...r }));
  colData[key] = withIds;
  collectionsMeta.push({ key, name, short, dynasty, desc, count: withIds.length });
  for (const r of withIds) {
    poems.push({ id: r.id, t: r.t, a: r.a || "", c: key, r: r.r || "", s: r.s || "" });
  }
}

// ---- 唐诗三百首 ----
{
  const j = readJson("蒙学/tangshisanbaishou.json");
  const rows = [];
  for (const grp of j.content || []) {
    const type = simp(grp.type);
    for (const item of grp.content || []) {
      rows.push({ t: simp(item.chapter), a: simp(item.author), s: type, p: toLines(item.paragraphs).map(simp) });
    }
  }
  addCollection("tangshi300", "唐诗三百首", "唐诗", "唐", "蘅塘退士编选的唐诗经典选本，五言、七言、绝句、律诗与古风一册收齐，是中国流传最广的诗歌选本。", rows);
}

// ---- 千家诗 ----
{
  const j = readJson("蒙学/qianjiashi.json");
  const rows = [];
  for (const grp of j.content || []) {
    const type = simp(grp.type);
    for (const item of grp.content || []) {
      rows.push({ t: simp(item.chapter), a: stripDynasty(item.author), s: type, p: toLines(item.paragraphs).map(simp) });
    }
  }
  addCollection("qianjiashi", "千家诗", "千家诗", "宋 / 明", "南宋谢枋得与明代王相先后编定的蒙学诗选，题材贴近日常，是古人开蒙读诗的第一本。", rows);
}

// ---- 宋词三百首 ----
{
  const j = readJson("宋词/宋词三百首.json");
  const rows = j.map((item) => ({
    t: simp(item.rhythmic),
    a: simp(item.author),
    r: simp(item.rhythmic),
    p: (item.paragraphs || []).map(simp),
  }));
  addCollection("songci300", "宋词三百首", "宋词", "宋", "朱孝臧（彊村）选编的宋词名篇，婉约与豪放并举，是近代以来影响最大的宋词选本。", rows);
}

// ---- 诗经 ----
{
  const j = readJson("诗经/shijing.json");
  const rows = j.map((item) => ({
    t: simp(item.title),
    a: "",
    s: simp(String(item.chapter) + " · " + String(item.section)),
    p: (item.content || []).map(simp),
  }));
  addCollection("shijing", "诗经", "诗经", "先秦", "中国最早的诗歌总集，风、雅、颂三百零五篇，四言为主，是中国诗歌的源头。", rows);
}

// ---- 楚辞 ----
{
  const j = readJson("楚辞/chuci.json");
  const rows = j.map((item) => ({
    t: simp(item.title),
    a: simp(item.author || "屈原"),
    s: simp(item.section || ""),
    p: (item.content || []).map(simp),
  }));
  addCollection("chuci", "楚辞", "楚辞", "战国", "屈原开创的楚地骚体文学，想象瑰丽、辞采飞扬，是浪漫主义文学的源头。", rows);
}

// ---- 元曲（精选） ----
{
  const j = readJson("元曲/yuanqu.json");
  const FAMOUS = ["关汉卿","白朴","马致远","郑光祖","王实甫","张养浩","乔吉","张可久","贯云石","徐再思","卢挚","姚燧","王和卿","杨果","刘秉忠","刘时中","薛昂夫","赵孟頫","冯子振","曾瑞","周文质","睢景臣","范康","宫天挺","郑廷玉","武汉臣","杨显之","石君宝","纪君祥","康进之","尚仲贤","李好古","孟汉卿","李行道","张国宾","秦简夫","王子一","朱凯","萧天瑞","王晔","金仁杰","高文秀","李文蔚","李直夫","戴善甫","王仲文","岳伯川","孔文卿","张寿卿","孙仲章","杨景贤","贾仲明","刘唐卿","李寿卿","王伯成","费唐臣","李取进","鲍天佑","赵公辅"];
  const PER_AUTHOR = 20;
  const MAX = 1200;
  const seen = new Set();
  const picked = [];
  const authorCount = new Map();
  const push = (item) => {
    const p = (item.paragraphs || []).map(simp).filter(Boolean);
    if (!p.length) return;
    const key = simp(item.title) + "|" + p.join("");
    if (seen.has(key)) return;
    seen.add(key);
    picked.push({ t: simp(item.title), a: simp(item.author), p });
  };
  for (const item of j) {
    const a = simp(item.author);
    if (FAMOUS.includes(a) && (authorCount.get(a) || 0) < PER_AUTHOR) {
      push(item);
      authorCount.set(a, (authorCount.get(a) || 0) + 1);
    }
  }
  for (const item of j) {
    if (picked.length >= MAX) break;
    push(item);
  }
  addCollection("yuanqu", "元曲", "元曲", "元", "关汉卿、白朴、马致远等大家与佚名作者的代表散曲，市井烟火里的杂剧与清唱。", picked.slice(0, MAX));
}

// ---- 花间集 ----
{
  const rows = [];
  for (const v of ["1","2","3","4","5","6","7","8","9","x"]) {
    const j = readJson("五代诗词/huajianji/huajianji-" + v + "-juan.json");
    for (const item of j) {
      rows.push({
        t: simp(item.title),
        a: simp(item.author),
        r: simp(item.rhythmic || ""),
        p: (item.paragraphs || []).map(simp),
        notes: (item.notes || []).map(simp),
      });
    }
  }
  addCollection("huajianji", "花间集", "花间", "五代", "中国第一部文人词总集，温庭筠领衔的花间词派，浓艳细腻、句句含情。", rows);
}

// ---- 南唐二主词 ----
{
  const j = readJson("五代诗词/nantang/poetrys.json");
  const rows = j.map((item) => ({
    t: simp(item.title),
    a: simp(item.author),
    r: simp(item.rhythmic || ""),
    p: (item.paragraphs || []).map(simp),
    notes: (item.notes || []).map(simp),
  }));
  addCollection("nantang", "南唐二主词", "南唐", "五代", "李璟、李煜父子的词作合集，附逐句注释，后主词尤称绝唱。", rows);
}

// ---- 纳兰性德 ----
{
  const j = readJson("纳兰性德/纳兰性德诗集.json");
  const rows = j.map((item) => ({
    t: simp(item.title),
    a: simp(item.author || "纳兰性德"),
    p: (item.para || item.paragraphs || []).map(simp),
  }));
  addCollection("nalan", "纳兰性德", "纳兰", "清", "纳兰容若词全集，深情婉转、清丽自然，一句“人生若只如初见”传诵至今。", rows);
}

// ---- 曹操诗集 ----
{
  const j = readJson("曹操诗集/caocao.json");
  const rows = j.map((item) => ({
    t: simp(item.title),
    a: "曹操",
    p: (item.paragraphs || []).map(simp),
  }));
  addCollection("caocao", "曹操诗集", "曹操", "汉末", "魏武帝存世诗篇，气魄沉雄、古直悲凉，建安风骨的起点。", rows);
}

// ---- 水墨唐诗 ----
{
  const j = readJson("水墨唐诗/shuimotangshi.json");
  const rows = j.map((item) => ({
    t: simp(item.title),
    a: simp(item.author),
    p: (item.paragraphs || []).map(simp),
    tr: simp(item.prologue || ""),
  }));
  addCollection("shuimo", "水墨唐诗", "水墨唐诗", "唐", "一百七十六首经典唐诗，每首附白话译文，适合入门细读。", rows);
}

// ---- 幽梦影（清言） ----
{
  const j = readJson("幽梦影/youmengying.json");
  const CN = ["一","二","三","四","五","六","七","八","九","十","十一","十二","十三","十四","十五","十六","十七","十八","十九","二十"];
  const rows = j.map((item, i) => ({
    t: "幽梦影 · " + CN[i % CN.length],
    a: "张潮",
    p: [simp(item.content)],
    notes: (item.comment || []).map(simp),
  }));
  addCollection("qingyan", "幽梦影", "幽梦影", "清", "张潮的清言小品，一句一境、隽永有味，可作闲时清谈。", rows);
}

// ---- 蒙学 ----
{
  const mengxue = [];
  const pushMeng = (id, title, author, paragraphs, section = "") => {
    const p = (paragraphs || []).map(simp).filter(Boolean);
    if (p.length) mengxue.push({ id, title, author, paragraphs: p, ...(section ? { section } : {}) });
  };

  const szj = readJson("蒙学/sanzijing-new.json");
  pushMeng("sanzijing", "三字经", "王应麟", szj.paragraphs);

  const bjx = readJson("蒙学/baijiaxing.json");
  pushMeng("baijiaxing", "百家姓", "佚名", bjx.paragraphs);

  const qzw = readJson("蒙学/qianziwen.json");
  pushMeng("qianziwen", "千字文", "周兴嗣", qzw.paragraphs);

  const dzg = readJson("蒙学/dizigui.json");
  pushMeng("dizigui", "弟子规", "李毓秀", (dzg.content || []).flatMap((c) => c.paragraphs || []));

  const slqm = readJson("蒙学/shenglvqimeng.json");
  pushMeng("shenglvqimeng", "声律启蒙", "车万育", (slqm.content || []).flatMap((v) => (v.content || []).flatMap((c) => c.paragraphs || [])));

  const yxql = readJson("蒙学/youxueqionglin.json");
  pushMeng("youxueqionglin", "幼学琼林", "程登吉", (yxql.content || []).flatMap((v) => (v.content || []).flatMap((c) => c.paragraphs || [])));

  const zgxw = readJson("蒙学/zengguangxianwen.json");
  pushMeng("zengguangxianwen", "增广贤文", "佚名", (zgxw.content || []).flatMap((c) => c.paragraphs || []));

  const zzjx = readJson("蒙学/zhuzijiaxun.json");
  pushMeng("zhuzijiaxun", "朱子家训", "朱柏庐", zzjx.paragraphs);

  const wzmq = readJson("蒙学/wenzimengqiu.json");
  pushMeng("wenzimengqiu", "文字蒙求", "王筠", (wzmq.content || []).flatMap((c) => c.paragraphs || []));

  const gw = readJson("蒙学/guwenguanzhi.json");
  let gwSeq = 0;
  for (const vol of gw.content || []) {
    for (const art of vol.content || []) {
      gwSeq += 1;
      const author = stripDynasty(art.author || "");
      pushMeng("guwen-" + String(gwSeq).padStart(3, "0"), simp(art.chapter), author || "佚名", art.paragraphs ? toLines(art.paragraphs).map(simp) : [], simp(vol.title || ""));
    }
  }

  fs.writeFileSync(path.join(OUT, "mengxue.json"), JSON.stringify(mengxue), "utf8");
  console.log("mengxue:", mengxue.length, "docs");
}

// ---- 全唐诗（一期：前 44 个分片，共 44,000 首；写入额度 D1 免费 10 万行/天约束）----
{
  const TANG_PARTS = 44;
  const tangRows = [];
  let tangSeq = 0;
  for (let part = 0; part < TANG_PARTS; part++) {
    const f = path.join(SRC, "全唐诗", "poet.tang." + (part * 1000) + ".json");
    if (!fs.existsSync(f)) {
      console.warn("[build-data] 缺少全唐诗分片:", f);
      break;
    }
    const list = JSON.parse(fs.readFileSync(f, "utf8"));
    for (const item of list) {
      tangSeq += 1;
      const p = (item.paragraphs || []).map(simp).filter(Boolean);
      if (!p.length || !clean(item.title)) continue;
      tangRows.push({
        id: "quantangshi-" + String(tangSeq).padStart(5, "0"),
        t: simp(item.title),
        a: stripDynasty(item.author),
        s: "卷" + (part + 1),
        p,
      });
    }
  }
  addCollection("quantangshi", "全唐诗", "全唐诗", "唐", "清编《全唐诗》九百卷，一期收录前四十四卷；后续随数据分批扩录。", tangRows, 5);
  console.log("quantangshi:", tangRows.length, "poems");
}

// ---- 写文件 ----
const index = {
  generatedAt: localDate(),
  total: poems.length,
  collections: collectionsMeta,
  poems,
};

// [LETTER-POETRY-PLAN-001#1] 作者聚合（作者索引页用）
const authorMap = new Map();
for (const p of poems) {
  const a = (p.a || "").trim();
  if (!a) continue;
  const e = authorMap.get(a) ?? { name: a, ids: [] };
  e.ids.push(p.id);
  authorMap.set(a, e);
}
const authors = [...authorMap.values()].sort((x, y) => x.name.localeCompare(y.name, "zh-Hans-CN"));
fs.writeFileSync(path.join(OUT, "authors.json"), JSON.stringify(authors), "utf8");
console.log("authors.json:", authors.length, "authors");

// [LETTER-POETRY-PLAN-013#2] 诗河数据：全量诗目轻量清单（id/标题/作者/选集），供 /river 三维「诗河」场景使用
// 注意：本文件提交进仓库，CI 无数据源时沿用（build-data 顶部已处理 SRC 缺失分支）
const river = poems.map((p) => ({ id: p.id, t: p.t, a: p.a, c: p.c }));
fs.writeFileSync(path.join(OUT, "river.json"), JSON.stringify(river), "utf8");
console.log("river.json:", river.length, "poems");
// [LETTER-POETRY-PLAN-001#1] 静态 RSS（避免依赖 route handler）
const mengxueDocsForRss = JSON.parse(fs.readFileSync(path.join(OUT, "mengxue.json"), "utf8"));
fs.writeFileSync(path.join(ROOT, "public", "rss.xml"), buildRss(index, mengxueDocsForRss), "utf8");
// ---- D1 seed SQL（架构升级：数据进 D1，服务端检索）----
{
  const SEED_DIR = path.join(ROOT, "seed");
  // [LETTER-POETRY-PLAN-002] D1 schema：仅 id 主键索引（rows_written 按行+索引计数，免费 10 万/天）
  const seedSchema = `-- [LETTER-POETRY-PLAN-002] D1 schema
CREATE TABLE IF NOT EXISTS poems (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  collection TEXT NOT NULL,
  rhythmic TEXT NOT NULL DEFAULT '',
  section TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  tr TEXT NOT NULL DEFAULT ''
);
`;
  fs.writeFileSync(path.join(SEED_DIR, "0001_schema.sql"), seedSchema, "utf8");
  console.log("seed: 0001_schema.sql");
  fs.mkdirSync(SEED_DIR, { recursive: true });
  function sqlEscape(s) { return "'" + (s ?? "").toString().replace(/'/g, "''") + "'"; }
  // [LETTER-POETRY-PLAN-002#2] 单字索引：标题/作者/正文去重单字，供 FTS5 中文检索（候选 + 精排）
  function toChars(...texts) {
    const set = new Set();
    for (const t of texts) for (const ch of (t ?? "").toString()) if (ch.trim()) set.add(ch);
    return [...set].join(" ");
  }
  const seedRows = [];
  for (const [key, list] of Object.entries(colData)) {
    for (const r of list) {
      seedRows.push({
        id: r.id, t: r.t, a: r.a || "", c: key, r: r.r || "", s: r.s || "",
        text: (r.p || []).join("\n"),
        notes: r.notes ? JSON.stringify(r.notes) : "",
        tr: r.tr || "",
        chars: toChars(r.t, r.a || "", (r.p || []).join("\n")),
      });
    }
  }
  // 分片：每片 6000 首（poems 6000 + fts 6000 = 12000 行写），单日总写 = 2 × 诗数 < 10 万
  const PART_SIZE = 6000;
  const parts = [];
  for (let i = 0; i < seedRows.length; i += PART_SIZE) {
    const chunk = seedRows.slice(i, i + PART_SIZE);
    const lines = [];
    for (let j = 0; j < chunk.length; ) {
      const sub = [];
      let bytes = 0;
      while (j < chunk.length && bytes < 20000) {
        const r = chunk[j];
        bytes += sqlEscape(r.id).length + sqlEscape(r.t).length + sqlEscape(r.a).length + sqlEscape(r.c).length + sqlEscape(r.r).length + sqlEscape(r.s).length + sqlEscape(r.text).length + sqlEscape(r.notes).length + sqlEscape(r.tr).length;
        sub.push(r);
        j += 1;
      }
      const pv = sub.map((r) => `(${sqlEscape(r.id)},${sqlEscape(r.t)},${sqlEscape(r.a)},${sqlEscape(r.c)},${sqlEscape(r.r)},${sqlEscape(r.s)},${sqlEscape(r.text)},${sqlEscape(r.notes)},${sqlEscape(r.tr)})`).join(",");
      lines.push(`INSERT OR REPLACE INTO poems (id,title,author,collection,rhythmic,section,text,notes,tr) VALUES ${pv};`);
    }
    parts.push(lines.join("\n"));
  }
  parts.forEach((sql, i) => {
    const f = path.join(SEED_DIR, "seed_" + String(i + 1).padStart(2, "0") + ".sql");
    fs.writeFileSync(f, sql, "utf8");
    console.log("seed:", path.basename(f));
  });
  console.log("seed total rows:", seedRows.length, "parts:", parts.length);

  // 选集元数据（首页/统计/列表入口，体积小，可进 bundle）
  const metaOut = { generatedAt: index.generatedAt, total: index.total, collections: collectionsMeta };
  fs.writeFileSync(path.join(OUT, "collections-meta.json"), JSON.stringify(metaOut), "utf8");
  console.log("collections-meta.json:", metaOut.total, "poems");
}
console.log("rss.xml: generated");

const stat = (p) => fs.statSync(p).size;
console.log("=== build-data done ===");
for (const c of collectionsMeta) {
  console.log(c.key.padEnd(12), String(c.count).padStart(5));
}
console.log("mengxue.json:", (stat(path.join(OUT, "mengxue.json")) / 1024).toFixed(1) + " KB");
console.log("total poems:", poems.length);
// ---- 生成打包数据（Worker bundle 使用，替代运行时 fs 读取） ----
const genDir = path.join(ROOT, "lib", "generated");
fs.mkdirSync(genDir, { recursive: true });
const mengxueForBundle = JSON.parse(fs.readFileSync(path.join(OUT, "mengxue.json"), "utf8"));
fs.writeFileSync(path.join(genDir, "mengxue.json"), JSON.stringify(mengxueForBundle), "utf8");
fs.writeFileSync(path.join(genDir, "authors.json"), JSON.stringify(authors), "utf8");
const metaForBundle = JSON.parse(fs.readFileSync(path.join(OUT, "collections-meta.json"), "utf8"));
fs.writeFileSync(path.join(genDir, "collections-meta.json"), JSON.stringify(metaForBundle), "utf8");
console.log("generated lib/generated/*.json for bundle");
