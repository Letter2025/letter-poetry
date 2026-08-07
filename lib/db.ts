// [LETTER-POETRY-PLAN-002#4] D1 数据访问层（仅服务端：server component / route handler 使用）
// 数据模型：poems 表（id 主键），文本/元数据全部存 D1；列表与作者索引走 Assets 静态分片
import { env } from "cloudflare:workers";
import type { PoemRow } from "./types";

export type { PoemRow };

type D1Database = {
  prepare(sql: string): {
    bind(...args: unknown[]): {
      first<T = Record<string, unknown>>(col?: string): Promise<T | null>;
      all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
      run(): Promise<{ meta: { rows_written: number } }>;
    };
  };
};

declare module "cloudflare:workers" {
  export const env: { DB: D1Database; ZHIPU_API_KEY?: string };
}

const COLS = "id,title,author,collection,rhythmic,section,text,notes,tr";

export async function getPoemRow(id: string): Promise<PoemRow | null> {
  const row = await env.DB.prepare(`SELECT ${COLS} FROM poems WHERE id = ?`)
    .bind(id)
    .first<PoemRow>();
  return row;
}

export async function getDailyPoemRow(): Promise<PoemRow | null> {
  const cnt = await env.DB.prepare("SELECT COUNT(*) AS n FROM poems").first<{ n: number }>();
  const total = cnt?.n ?? 0;
  if (!total) return null;
  const ymd = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" }).replace(/-/g, "");
  const offset = parseInt(ymd, 10) % total;
  const row = await env.DB.prepare(`SELECT ${COLS} FROM poems LIMIT 1 OFFSET ?`)
    .bind(offset)
    .first<PoemRow>();
  return row;
}

// 按作者精确查询（author 列无索引，全表扫描；个人站读额度内可接受）
export async function getAuthorPoems(name: string, page = 1, size = 100): Promise<SearchResult> {
  const cnt = await env.DB.prepare("SELECT COUNT(*) AS n FROM poems WHERE author = ?")
    .bind(name)
    .first<{ n: number }>();
  const items = await env.DB.prepare(`SELECT ${COLS} FROM poems WHERE author = ? ORDER BY id LIMIT ? OFFSET ?`)
    .bind(name, size, (page - 1) * size)
    .all<PoemRow>();
  return { total: cnt?.n ?? 0, page, size, items: items.results ?? [] };
}

// [LETTER-POETRY-PLAN-005] sitemap：诗数 + 分页 id 列表
export async function getPoemCount(): Promise<number> {
  const cnt = await env.DB.prepare("SELECT COUNT(*) AS n FROM poems").first<{ n: number }>();
  return cnt?.n ?? 0;
}

export async function getPoemIdsPage(page: number, size = 10000): Promise<string[]> {
  const offset = Math.max(0, (page - 1) * size);
  const rows = await env.DB.prepare("SELECT id FROM poems ORDER BY id LIMIT ? OFFSET ?")
    .bind(size, offset)
    .all<{ id: string }>();
  return (rows.results ?? []).map((r) => r.id);
}

export async function getRandomPoemRow(): Promise<PoemRow | null> {
  const cnt = await env.DB.prepare("SELECT COUNT(*) AS n FROM poems").first<{ n: number }>();
  const total = cnt?.n ?? 0;
  if (!total) return null;
  const offset = Math.floor(Math.random() * total);
  const row = await env.DB.prepare(`SELECT ${COLS} FROM poems LIMIT 1 OFFSET ?`)
    .bind(offset)
    .first<PoemRow>();
  return row;
}

export type SearchOpts = {
  q?: string;
  c?: string;
  ids?: string[];
  author?: string;
  page?: number;
  size?: number;
};

export type SearchResult = {
  total: number;
  page: number;
  size: number;
  items: SearchItem[];
};

export type SearchItem = PoemRow & { hit?: string };

// [LETTER-POETRY-PLAN-006] 命中行：text 命中时返回含关键词的行（最多 2 行）；标题/作者命中不额外返回
function computeHit(row: PoemRow, q: string): string | undefined {
  const needle = q.trim();
  if (!needle) return undefined;
  if (row.title.includes(needle) || row.author.includes(needle)) return undefined;
  const hitLines = row.text.split("\n").filter((l) => l.includes(needle)).slice(0, 2);
  return hitLines.length > 0 ? hitLines.join("  ") : undefined;
}

export async function searchPoems(opts: SearchOpts): Promise<SearchResult> {
  const page = Math.max(1, opts.page ?? 1);
  const size = Math.min(100, Math.max(1, opts.size ?? 30));
  const where: string[] = [];
  const params: unknown[] = [];
  const q = opts.q?.trim() ?? "";
  const like = `%${q}%`;

  if (opts.c) {
    where.push("collection = ?");
    params.push(opts.c);
  }
  if (opts.ids && opts.ids.length > 0) {
    where.push(`id IN (${opts.ids.map(() => "?").join(",")})`);
    params.push(...opts.ids);
  }
  if (opts.author) {
    where.push("author = ?");
    params.push(opts.author);
  }
  if (q) {
    where.push("(title LIKE ? OR author LIKE ? OR text LIKE ?)");
    params.push(like, like, like);
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const cnt = await env.DB.prepare(`SELECT COUNT(*) AS n FROM poems ${whereSql}`)
    .bind(...params)
    .first<{ n: number }>();

  // [LETTER-POETRY-PLAN-006] 相关性排序：标题前缀 > 标题包含 > 作者 > 正文
  const orderParams: unknown[] = q ? [`${q}%`, like, like] : [];
  const orderSql = q
    ? "ORDER BY CASE WHEN title LIKE ? THEN 0 WHEN title LIKE ? THEN 1 WHEN author LIKE ? THEN 2 ELSE 3 END, id"
    : "ORDER BY id";
  const rows = await env.DB.prepare(
    `SELECT ${COLS} FROM poems ${whereSql} ${orderSql} LIMIT ? OFFSET ?`
  )
    .bind(...params, ...orderParams, size, (page - 1) * size)
    .all<PoemRow>();

  const items: SearchItem[] = (rows.results ?? []).map((r) =>
    q ? { ...r, hit: computeHit(r, q) } : r
  );

  return { total: cnt?.n ?? 0, page, size, items };
}