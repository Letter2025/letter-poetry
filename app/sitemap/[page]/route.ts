// [LETTER-POETRY-PLAN-005] 详情页分页 sitemap：每页 10,000 条（D1 分页查询）
import { getPoemIdsPage } from "@/lib/db";

export const dynamic = "force-dynamic";

const SITE = "https://poetry.myletter.top";
const PAGE_SIZE = 10000;

export async function GET(_req: Request, { params }: { params: { page: string } }): Promise<Response> {
  const page = Math.max(1, Number(params.page) || 1);
  const ids = await getPoemIdsPage(page, PAGE_SIZE);
  if (ids.length === 0) return new Response("not found", { status: 404 });
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    ids.map((id) => `  <url><loc>${SITE}/poem/${id}</loc></url>`).join("\n") +
    `\n</urlset>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}