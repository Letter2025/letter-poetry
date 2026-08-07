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
  return Response.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}