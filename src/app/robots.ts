import type { MetadataRoute } from "next";
import { SITE_URL } from "@lib/site";

// Tells search engines what to crawl. Account and sign-in pages are useless in search results
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/profile", "/login", "/auth/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
