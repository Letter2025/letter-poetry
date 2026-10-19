// [LETTER-POETRY-PLAN-014] D1 配额治理守卫：禁止全表扫描取诗；静态 id 池与计数产物必须一致
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const db = read("lib/db.ts");
const ids = JSON.parse(read("lib/generated/sitemap-ids.json"));
const meta = JSON.parse(read("lib/generated/collections-meta.json"));

test("lib/db.ts 不再用全表扫描取诗（COUNT(*) / LIMIT 1 OFFSET）", () => {
  assert.ok(!db.includes("FROM poems LIMIT 1 OFFSET"), "随机/每日一诗不得再用 OFFSET 逐行扫描");
  assert.ok(!/SELECT COUNT\(\*\) AS n FROM poems`/.test(db), "无筛选计数必须走静态 meta.total");
});

test("随机/每日一诗都基于静态 id 池直查主键", () => {
  const pools = db.match(/sitemapIds as string\[\]/g) ?? [];
  assert.ok(pools.length >= 2, "getDailyPoemRow / getRandomPoemRow 应各自使用静态 id 池");
  assert.ok(/WHERE id = \?/.test(db), "取诗必须走主键直查");
});

test("静态 id 池与计数产物可用且一致", () => {
  assert.ok(Array.isArray(ids) && ids.length > 1000, "sitemap-ids.json 应包含完整 id 列表");
  assert.equal(new Set(ids).size, ids.length, "id 不应重复");
  assert.equal(ids.length, meta.total, "sitemap id 数应与 collections-meta.total 一致");
});

test("随机/每日 API 带边缘缓存头，避免突发打穿 D1", () => {
  for (const p of ["app/api/poem/daily/route.ts", "app/api/poem/random/route.ts"]) {
    assert.ok(/s-maxage=\d+/.test(read(p)), `${p} 应带 s-maxage 缓存头`);
  }
});
