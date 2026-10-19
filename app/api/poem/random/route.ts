// [LETTER-POETRY-PLAN-002#6] 随机一首 API
// [LETTER-POETRY-PLAN-014] 主键直查（1 行读）+ 15s 边缘缓存：突发流量不再放大成全表扫
import { getRandomPoemRow } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const row = await getRandomPoemRow();
  if (!row) return Response.json({ error: "empty" }, { status: 404 });
  return Response.json(row, { headers: { "Cache-Control": "public, max-age=0, s-maxage=15" } });
}