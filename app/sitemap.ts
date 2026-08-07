import type { MetadataRoute } from "next";
import { getAuthors, getCollections, getMengxue } from "@/lib/poetry";

const siteUrl = "https://poetry.myletter.top";

// [LETTER-POETRY-PLAN-002#7] sitemap：精选（首页/选集/作者/蒙学），不再逐首（全量数万条过大）
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/poems`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/authors`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/mengxue`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/favorites`, changeFrequency: "monthly", priority: 0.3 },
  ];
  for (const c of getCollections()) {
    entries.push({ url: `${siteUrl}/collections/${c.key}`, changeFrequency: "weekly", priority: 0.8 });
  }
  for (const a of getAuthors()) {
    entries.push({ url: `${siteUrl}/authors/${encodeURIComponent(a.name)}`, changeFrequency: "monthly", priority: 0.5 });
  }
  for (const d of getMengxue()) {
    entries.push({ url: `${siteUrl}/mengxue/${d.id}`, changeFrequency: "monthly", priority: 0.4 });
  }
  return entries;
}