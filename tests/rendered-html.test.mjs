// [LETTER-POETRY-PLAN-001#8] 数据与构建产物冒烟测试
// 运行前提：npm run build-data 已生成数据；npm run build 已产出 dist/server
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

test("index.json 结构：12 部选集、3609 篇、id 唯一且格式合法", () => {
  const idx = readJson("lib/generated/index.json");
  assert.equal(idx.collections.length, 12, "应为 12 部选集");
  assert.equal(idx.total, 3609, "应收录 3609 篇");
  assert.ok(idx.generatedAt && /^\d{4}-\d{2}-\d{2}$/.test(idx.generatedAt), "generatedAt 应为 YYYY-MM-DD");
  const ids = idx.poems.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, "poem id 应唯一");
  for (const p of idx.poems) {
    assert.match(p.id, /^[a-z0-9]+-\d{3,4}$/, `id 格式非法: ${p.id}`);
    assert.ok(idx.collections.some((c) => c.key === p.c), `id 引用了未知选集: ${p.id}`);
  }
});

test("public/data 与 lib/generated 数据一致", () => {
  assert.deepEqual(readJson("public/data/index.json"), readJson("lib/generated/index.json"), "index.json 应一致");
  assert.deepEqual(readJson("public/data/mengxue.json"), readJson("lib/generated/mengxue.json"), "mengxue.json 应一致");
});

test("full.json：单请求全文检索全集", () => {
  const idx = readJson("lib/generated/index.json");
  const full = readJson("public/data/full.json");
  assert.equal(full.length, idx.total, "full.json 篇目数应与 total 一致");
  for (const item of full) {
    assert.ok(item.id && item.t && Array.isArray(item.p), "full.json 条目字段缺失");
    assert.ok(idx.poems.some((p) => p.id === item.id), `full.json 引用了未知 id: ${item.id}`);
  }
});

test("authors.json：作者聚合非空且 id 有效", () => {
  const idx = readJson("lib/generated/index.json");
  const authors = readJson("lib/generated/authors.json");
  assert.ok(authors.length > 100, "作者数应大于 100");
  const allIds = new Set(idx.poems.map((p) => p.id));
  for (const a of authors) {
    assert.ok(a.name && Array.isArray(a.ids), "作者条目字段缺失");
    for (const id of a.ids) assert.ok(allIds.has(id), `作者 ${a.name} 引用了未知 id: ${id}`);
  }
});

test("mengxue.json：古文观止条目含卷信息", () => {
  const docs = readJson("lib/generated/mengxue.json");
  const guwen = docs.filter((d) => d.id.startsWith("guwen-"));
  assert.ok(guwen.length > 100, "古文观止篇数应大于 100");
  for (const d of guwen) assert.ok(d.section, `古文观止条目缺少 section: ${d.id}`);
});

test("manifest.webmanifest 与 rss.xml 产物", () => {
  const manifest = readJson("public/manifest.webmanifest");
  assert.ok(manifest.name && manifest.icons.length >= 2, "manifest 应含名称与图标");
  assert.ok(exists("public/icon-512.png"), "缺少 icon-512.png");
  const rss = fs.readFileSync(path.join(ROOT, "public/rss.xml"), "utf8");
  assert.ok(rss.includes('<rss version="2.0">'), "rss.xml 应为 RSS 2.0");
  assert.ok(rss.includes("<item>"), "rss.xml 应含条目");
  const rssItems = (rss.match(/<item>/g) || []).length;
  assert.ok(rssItems >= 15 && rssItems <= 30, `rss.xml 条目数应在 15-30 之间，实际 ${rssItems}`);
});

test("构建产物 dist/server/wrangler.json 存在且名称正确", () => {
  const wr = readJson("dist/server/wrangler.json");
  assert.equal(wr.name, "letter-poetry", "wrangler 配置 name 应为 letter-poetry");
});