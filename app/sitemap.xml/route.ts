// [LETTER-POETRY-PLAN-005] sitemap index：引用精选子文件 + 详情页分页
import { getPoemCount } from "@/lib/db";

export const dynamic = "force-dynamic";

const SITE = "https://poetry.myletter.top";
const PAGE_SIZE = 10000;

export async function GET() {
  const total = await getPoemCount();
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const locs = [`${SITE}/sitemap-static.xml`];
  for (let i = 1; i <= pages; i++) locs.push(`${SITE}/sitemap/${i}`);
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    locs.map((l) => `  <sitemap><loc>${l}</loc></sitemap>`).join("\n") +
    `\n</sitemapindex>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}