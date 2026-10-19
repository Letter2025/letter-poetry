// [LETTER-POETRY-PLAN-002#6] 每日一诗 API（按日期 seed 取一首）
// [LETTER-POETRY-PLAN-014] 主键直查（1 行读）+ 10 分钟边缘缓存（同一首诗全天不变）
import { getDailyPoemRow } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const row = await getDailyPoemRow();
  if (!row) return Response.json({ error: "empty" }, { status: 404 });
  return Response.json(row, { headers: { "Cache-Control": "public, max-age=0, s-maxage=600" } });
}