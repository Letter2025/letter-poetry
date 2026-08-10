// [LETTER-POETRY-PLAN-013#7] 诗河数据（river.json）冒烟测试
// 运行前提：npm run build-data 已生成 public/data/river.json（已提交，CI 沿用）
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

test("river.json：结构完整、数量正确、id 唯一", () => {
  const f = path.join(ROOT, "public/data/river.json");
  assert.ok(fs.existsSync(f), "river.json 应存在（构建产物，已提交）");
  const river = JSON.parse(fs.readFileSync(f, "utf8"));
  assert.ok(Array.isArray(river), "应为数组");
  assert.ok(river.length >= 47000, `期望 >= 47000 首，实际 ${river.length}`);
  const ids = new Set();
  for (const p of river) {
    assert.ok(p && typeof p.id === "string" && p.id.length > 0, "id 缺失");
    assert.ok(typeof p.t === "string" && p.t.length > 0, "标题缺失: " + p.id);
    assert.ok(typeof p.a === "string", "作者字段缺失: " + p.id);
    assert.ok(typeof p.c === "string" && p.c.length > 0, "选集字段缺失: " + p.id);
    assert.ok(!ids.has(p.id), "id 重复: " + p.id);
    ids.add(p.id);
  }
  // 全唐诗段应有主体数量
  const tang = river.filter((p) => p.c === "quantangshi");
  assert.ok(tang.length >= 44000, "全唐诗应 >= 44000 首");
});