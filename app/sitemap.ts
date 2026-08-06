import type { MetadataRoute } from "next";
import { getCollections, getIndex, getMengxue } from "@/lib/poetry";

const siteUrl = "https://poetry.myletter.top";

export default function sitemap(): MetadataRoute.Sitemap {
  const index = getIndex();
  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/poems`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/mengxue`, changeFrequency: "weekly", priority: 0.7 },
  ];
  for (const c of getCollections()) {
    entries.push({ url: `${siteUrl}/collections/${c.key}`, changeFrequency: "weekly", priority: 0.8 });
  }
  for (const p of index.poems) {
    entries.push({ url: `${siteUrl}/poem/${p.id}`, changeFrequency: "monthly", priority: 0.6 });
  }
  for (const d of getMengxue()) {
    entries.push({ url: `${siteUrl}/mengxue/${d.id}`, changeFrequency: "monthly", priority: 0.5 });
  }
  return entries;
}