import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sify } from "chinese-conv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.resolve(ROOT, "..", "cf-poetry-data");
const OUT = path.join(ROOT, "public", "data");
const COL_DIR = path.join(OUT, "collections");
// 数据源不存在时（如 CI 环境），使用已提交的生成数据，跳过重新生成。
if (!fs.existsSync(SRC)) {
  const idx = path.join(OUT, "index.json");
  const gen = path.join(ROOT, "lib", "generated", "index.json");
  if (!fs.existsSync(idx) || !fs.existsSync(gen)) {
    console.error("[build-data] 缺少数据源目录，且没有已提交的生成数据。");
    process.exit(1);
  }
  console.log("[build-data] 数据源目录不存在，沿用已提交的生成数据。");
  process.exit(0);
}


fs.mkdirSync(COL_DIR, { recursive: true });

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

const collectionsMeta = [];
const poems = [];
const colData = {};

function addCollection(key, name, short, dynasty, desc, rows) {
  const list = rows.filter((r) => r.p && r.p.length > 0 && clean(r.t));
  const withIds = list.map((r, i) => ({ id: key + "-" + String(i + 1).padStart(3, "0"), ...r }));
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
  const pushMeng = (id, title, author, paragraphs) => {
    const p = (paragraphs || []).map(simp).filter(Boolean);
    if (p.length) mengxue.push({ id, title, author, paragraphs: p });
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
      pushMeng("guwen-" + String(gwSeq).padStart(3, "0"), simp(art.chapter), author || "佚名", art.paragraphs ? toLines(art.paragraphs).map(simp) : []);
    }
  }

  fs.writeFileSync(path.join(OUT, "mengxue.json"), JSON.stringify(mengxue), "utf8");
  console.log("mengxue:", mengxue.length, "docs");
}

// ---- 写文件 ----
const index = {
  generatedAt: new Date().toISOString().slice(0, 10),
  total: poems.length,
  collections: collectionsMeta,
  poems,
};

fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index), "utf8");
for (const [key, list] of Object.entries(colData)) {
  fs.writeFileSync(path.join(COL_DIR, key + ".json"), JSON.stringify(list), "utf8");
}

const stat = (p) => fs.statSync(p).size;
console.log("=== build-data done ===");
for (const c of collectionsMeta) {
  const kb = (stat(path.join(COL_DIR, c.key + ".json")) / 1024).toFixed(1);
  console.log(c.key.padEnd(12), String(c.count).padStart(5), kb.padStart(7) + " KB");
}
console.log("index.json:", (stat(path.join(OUT, "index.json")) / 1024).toFixed(1) + " KB");
console.log("mengxue.json:", (stat(path.join(OUT, "mengxue.json")) / 1024).toFixed(1) + " KB");
console.log("total poems:", poems.length);
// ---- 生成打包数据（Worker bundle 使用，替代运行时 fs 读取） ----
const genDir = path.join(ROOT, "lib", "generated");
fs.mkdirSync(genDir, { recursive: true });
fs.writeFileSync(path.join(genDir, "index.json"), JSON.stringify(index), "utf8");
fs.writeFileSync(path.join(genDir, "collections.json"), JSON.stringify(colData), "utf8");
const mengxueForBundle = JSON.parse(fs.readFileSync(path.join(OUT, "mengxue.json"), "utf8"));
fs.writeFileSync(path.join(genDir, "mengxue.json"), JSON.stringify(mengxueForBundle), "utf8");
console.log("generated lib/generated/*.json for bundle");
