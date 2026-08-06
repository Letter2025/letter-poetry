import type { MetadataRoute } from "next";

const siteUrl = "https://poetry.myletter.top";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}