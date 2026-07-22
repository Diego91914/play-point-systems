import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/live/quick-score/success"],
    },
    sitemap: "https://www.playpointsystems.com/sitemap.xml",
    host: "https://www.playpointsystems.com",
  };
}
