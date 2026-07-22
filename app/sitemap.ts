import type { MetadataRoute } from "next";

const publicRoutes = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/games", priority: 0.9, changeFrequency: "monthly" },
  { path: "/live", priority: 0.9, changeFrequency: "monthly" },
  { path: "/live/quick-score", priority: 0.9, changeFrequency: "weekly" },
  { path: "/shot-caddy", priority: 0.8, changeFrequency: "monthly" },
  { path: "/games/trivia", priority: 0.8, changeFrequency: "monthly" },
  { path: "/music", priority: 0.8, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  { path: "/support", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-07-21T00:00:00.000Z");

  return publicRoutes.map((route) => ({
    url: `https://www.playpointsystems.com${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
