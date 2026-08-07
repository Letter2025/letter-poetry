// [LETTER-POETRY-PLAN-002#6] 随机一首 API
import { getRandomPoemRow } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const row = await getRandomPoemRow();
  if (!row) return Response.json({ error: "empty" }, { status: 404 });
  return Response.json(row, { headers: { "Cache-Control": "no-store" } });
}