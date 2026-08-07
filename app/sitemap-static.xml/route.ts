// [LETTER-POETRY-PLAN-005] 精选 sitemap（首页/选集/作者/蒙学/收藏），bundle 数据生成，无需 D1
import { getAuthors, getCollections, getMengxue } from "@/lib/poetry";

const SITE = "https://poetry.myletter.top";

export async function GET() {
  const urls: string[] = [SITE, `${SITE}/poems`, `${SITE}/authors`, `${SITE}/mengxue`, `${SITE}/favorites`];
  for (const c of getCollections()) urls.push(`${SITE}/collections/${c.key}`);
  for (const a of getAuthors()) urls.push(`${SITE}/authors/${encodeURIComponent(a.name)}`);
  for (const d of getMengxue()) urls.push(`${SITE}/mengxue/${d.id}`);
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") +
    `\n</urlset>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}