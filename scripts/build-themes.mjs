// [LETTER-POETRY-PLAN-009] 生成 themes.json：精选诗单（季节/主题）→ D1 匹配真实 id
// 用法：$env:CF_TOKEN=...; $env:CF_ACCOUNT=...; node scripts/build-themes.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const TOKEN = process.env.CF_TOKEN;
const ACCOUNT = process.env.CF_ACCOUNT;
const DB = "2b40b040-71d5-4931-b6a3-d963b158003c";
if (!TOKEN || !ACCOUNT) {
  console.error("need CF_TOKEN and CF_ACCOUNT env");
  process.exit(1);
}

async function query(sql, params = []) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database/${DB}/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params }),
    }
  );
  const j = await res.json();
  if (!j.success) throw new Error(JSON.stringify(j.errors));
  return j.result?.[0]?.results ?? [];
}

// 候选诗单：[组slug, 组名, 组标题, 组简介, [ {t, a?} ]]
const GROUPS = [
  { slug: "season-spring", kind: "season", name: "春日", title: "春眠不觉晓，处处闻啼鸟", desc: "把春日的花、雨、柳与早莺收进一册。", items: [
    { t: "春晓", a: "孟浩然" }, { t: "江南春", a: "杜牧" }, { t: "咏柳", a: "贺知章" }, { t: "鸟鸣涧", a: "王维" }, { t: "春夜喜雨", a: "杜甫" }, { t: "早春呈水部张十八员外", a: "韩愈" }, { t: "江畔独步寻花", a: "杜甫" }, { t: "绝句", a: "杜甫" },
  ] },
  { slug: "season-summer", kind: "season", name: "夏日", title: "绿树阴浓夏日长", desc: "盛夏的池荷、树荫与蝉声。", items: [
    { t: "池上", a: "白居易" }, { t: "山亭夏日", a: "高骈" }, { t: "小池" },
  ] },
  { slug: "season-autumn", kind: "season", name: "秋声", title: "自古逢秋悲寂寥", desc: "秋日的月色、砧声与登高。", items: [
    { t: "山居秋暝", a: "王维" }, { t: "枫桥夜泊", a: "张继" }, { t: "登高", a: "杜甫" }, { t: "山行", a: "杜牧" }, { t: "秋词", a: "刘禹锡" }, { t: "暮江吟", a: "白居易" }, { t: "峨眉山月歌", a: "李白" }, { t: "清江引·秋思", a: "张可久" },
  ] },
  { slug: "season-winter", kind: "season", name: "冬日", title: "晚来天欲雪，能饮一杯无", desc: "围炉、踏雪与归家的灯火。", items: [
    { t: "江雪", a: "柳宗元" }, { t: "别董大", a: "高适" }, { t: "逢雪宿芙蓉山主人", a: "刘长卿" }, { t: "白雪歌送武判官归京", a: "岑参" }, { t: "问刘十九", a: "白居易" }, { t: "长相思·山一程" }, { t: "梅花" },
  ] },
  { slug: "theme-moon", kind: "theme", name: "明月", title: "海上生明月，天涯共此时", desc: "月是离人眼里最长的牵挂。", items: [
    { t: "静夜思", a: "李白" }, { t: "春江花月夜", a: "张若虚" }, { t: "水调歌头", a: "苏轼" }, { t: "月下独酌", a: "李白" }, { t: "望月怀远", a: "张九龄" }, { t: "十五夜望月", a: "王建" }, { t: "宿建德江", a: "孟浩然" }, { t: "峨眉山月歌", a: "李白" }, { t: "夜月", a: "刘方平" },
  ] },
  { slug: "theme-farewell", kind: "theme", name: "送别", title: "劝君更尽一杯酒", desc: "长亭与灞桥的折柳。", items: [
    { t: "送元二使安西", a: "王维" }, { t: "赠汪伦", a: "李白" }, { t: "黄鹤楼送孟浩然之广陵", a: "李白" }, { t: "别董大", a: "高适" }, { t: "送杜少府之任蜀州", a: "王勃" }, { t: "芙蓉楼送辛渐", a: "王昌龄" }, { t: "赋得古原草送别", a: "白居易" }, { t: "淮上与友人别", a: "郑谷" },
  ] },
  { slug: "theme-homesick", kind: "theme", name: "思乡", title: "独在异乡为异客", desc: "故乡是一封写不完的信。", items: [
    { t: "九月九日忆山东兄弟", a: "王维" }, { t: "静夜思", a: "李白" }, { t: "黄鹤楼", a: "崔颢" }, { t: "次北固山下", a: "王湾" }, { t: "回乡偶书", a: "贺知章" }, { t: "月夜忆舍弟", a: "杜甫" }, { t: "杂诗", a: "王维" }, { t: "渡荆门送别", a: "李白" },
  ] },
  { slug: "theme-frontier", kind: "theme", name: "边塞", title: "黄沙百战穿金甲", desc: "铁马冰河与羌笛声中。", items: [
    { t: "出塞", a: "王昌龄" }, { t: "凉州词", a: "王之涣" }, { t: "凉州词", a: "王翰" }, { t: "白雪歌送武判官归京", a: "岑参" }, { t: "使至塞上", a: "王维" }, { t: "从军行", a: "王昌龄" }, { t: "塞下曲", a: "卢纶" }, { t: "雁门太守行", a: "李贺" },
  ] },
  { slug: "theme-pastoral", kind: "theme", name: "田园", title: "开轩面场圃，把酒话桑麻", desc: "田园是归隐者的一方净土。", items: [
    { t: "过故人庄", a: "孟浩然" }, { t: "渭川田家", a: "王维" }, { t: "悯农", a: "李绅" }, { t: "山居秋暝", a: "王维" },
  ] },
  { slug: "theme-history", kind: "theme", name: "咏史怀古", title: "旧时王谢堂前燕", desc: "登临怀古，世事如棋。", items: [
    { t: "赤壁", a: "杜牧" }, { t: "乌衣巷", a: "刘禹锡" }, { t: "蜀相", a: "杜甫" }, { t: "登幽州台歌", a: "陈子昂" }, { t: "泊秦淮", a: "杜牧" },
  ] },
];

const missing = [];
const groups = [];
for (const g of GROUPS) {
  const ids = [];
  for (const item of g.items) {
    const rows = await query("SELECT id,title,author FROM poems WHERE title LIKE ? LIMIT 10", [item.t + "%"]);
    let pick = null;
    if (rows.length === 1) pick = rows[0];
    else if (item.a) pick = rows.find((r) => (r.author || "").includes(item.a)) ?? rows[0];
    else pick = rows[0];
    if (pick) {
      ids.push(pick.id);
    } else {
      missing.push(`${g.slug} | ${item.t}${item.a ? " - " + item.a : ""}`);
    }
  }
  groups.push({ slug: g.slug, kind: g.kind, name: g.name, title: g.title, desc: g.desc, ids });
}

const out = { generatedAt: new Date().toISOString().slice(0, 10), groups };
const genDir = path.join(ROOT, "lib", "generated");
fs.writeFileSync(path.join(genDir, "themes.json"), JSON.stringify(out, null, 1), "utf8");
fs.writeFileSync(path.join(ROOT, "public", "data", "themes.json"), JSON.stringify(out, null, 1), "utf8");
console.log("themes.json written");
console.log("=== missing ===");
for (const m of missing) console.log("  " + m);
for (const g of groups) console.log(g.slug, g.ids.length, "ids");