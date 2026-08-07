// [LETTER-POETRY-PLAN-002#6] 详情 API（收藏页等客户端场景）
import { getPoemRow } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const row = await getPoemRow(params.id);
  if (!row) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(row, { headers: { "Cache-Control": "no-store" } });
}