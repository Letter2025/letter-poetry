// [LETTER-POETRY-PLAN-002#6] 列表/搜索 API：分页、选集过滤、关键词（LIKE）、批量 ids
import { searchPoems } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const c = url.searchParams.get("c") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const page = Number(url.searchParams.get("page") ?? "1");
  const size = Number(url.searchParams.get("size") ?? "30");
  const author = url.searchParams.get("author") ?? undefined;
  const idsRaw = url.searchParams.get("ids");
  const ids = idsRaw ? idsRaw.split(",").filter(Boolean).slice(0, 200) : undefined;

  const result = await searchPoems({ c, q, author, ids, page, size });
  // [LETTER-POETRY-PLAN-014] 结果与 URL 一一对应且不含用户私有数据 ⇒ 允许 60s 边缘缓存，
  // 避免爬虫/重复查询把 LIKE 全表扫放大成 D1 行读（免费额度 5M 行/天）
  return Response.json(result, {
    headers: { "Cache-Control": "public, max-age=0, s-maxage=60" },
  });
}