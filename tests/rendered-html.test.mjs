// [LETTER-POETRY-PLAN-002#8] 数据与构建产物冒烟测试（架构升级版）
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

test("collections-meta.json：13 部选集（含全唐诗）、总量正确", () => {
  const meta = readJson("lib/generated/collections-meta.json");
  assert.equal(meta.collections.length, 13, "应为 13 部选集（12 + 全唐诗）");
  assert.equal(meta.total, 47629, "总量应为 47629（全唐诗 44020 + 原 3609）");
  const qt = meta.collections.find((c) => c.key === "quantangshi");
  assert.ok(qt, "应含全唐诗");
  assert.equal(qt.count, 44020, "全唐诗应 44020 首（一期）");
  for (const c of meta.collections) assert.ok(c.count > 0, `选集 ${c.key} 计数异常`);
});

test("D1 seed 产物：schema + 8 片，无 FTS/事务残留", () => {
  const schema = fs.readFileSync(path.join(ROOT, "seed/0001_schema.sql"), "utf8");
  assert.ok(schema.includes("CREATE TABLE IF NOT EXISTS poems"), "schema 应建 poems 表");
  assert.ok(!schema.includes("poems_fts"), "schema 不应含 FTS 表（写入额度限制）");
  assert.ok(!schema.includes("CREATE INDEX"), "schema 仅依赖主键索引（rows_written 配额）");
  for (let i = 1; i <= 8; i++) {
    const f = path.join(ROOT, `seed/seed_${String(i).padStart(2, "0")}.sql`);
    assert.ok(exists(`seed/seed_${String(i).padStart(2, "0")}.sql`), `缺少 ${f}`);
    const sql = fs.readFileSync(f, "utf8");
    assert.ok(sql.includes("INSERT OR REPLACE INTO poems"), `${f} 应含 poems 插入`);
    assert.ok(!sql.includes("poems_fts"), `${f} 不应含 FTS 插入`);
    assert.ok(!sql.includes("BEGIN;"), `${f} 不应含事务语句`);
  }
});

test("authors.json：作者聚合（含全唐诗），id 格式合法", () => {
  const authors = readJson("lib/generated/authors.json");
  assert.ok(authors.length > 2000, `作者数应 >2000（一期全唐诗前 44 卷覆盖），实际 ${authors.length}`);
  const seen = new Set();
  for (const a of authors) {
    assert.ok(a.name && Array.isArray(a.ids), "作者条目字段缺失");
    for (const id of a.ids) {
      assert.match(id, /^(quantangshi-\d{5}|[a-z0-9]+-\d{3,4})$/, `id 格式非法: ${id}`);
      assert.ok(!seen.has(id), `id 重复: ${id}`);
      seen.add(id);
    }
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
  const rssItems = (rss.match(/<item>/g) || []).length;
  assert.ok(rssItems >= 15 && rssItems <= 30, `rss.xml 条目数应在 15-30 之间，实际 ${rssItems}`);
});

test("构建产物 dist/server/wrangler.json：名称正确且含 D1 binding", () => {
  const wr = readJson("dist/server/wrangler.json");
  assert.equal(wr.name, "letter-poetry", "wrangler 配置 name 应为 letter-poetry");
  assert.ok(Array.isArray(wr.d1_databases) && wr.d1_databases.length > 0, "应配置 D1 binding");
  assert.equal(wr.d1_databases[0].binding, "DB", "D1 binding 应为 DB");
});