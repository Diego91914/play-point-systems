import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      name: "Play Amplified",
      short_name: "Play Amplified",
      description: "Phones in the game. People in the moment.",
      id: "/",
      start_url: "/?source=pwa",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#05070b",
      theme_color: "#05070b",
      categories: ["games", "entertainment", "sports"],
      shortcuts: [
        {
          name: "My Games",
          short_name: "My Games",
          description: "Open your Play Amplified game library.",
          url: "/games?source=pwa-shortcut",
          icons: [
            {
              src: "/images/brand/play-point-systems-icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
          ],
        },
        {
          name: "QuickScore",
          short_name: "Score",
          description: "Open QuickScore.",
          url: "/live/quick-score?source=pwa-shortcut",
          icons: [
            {
              src: "/images/brand/play-point-systems-icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
          ],
        },
      ],
      icons: [
        {
          src: "/images/brand/play-point-systems-icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/images/brand/play-point-systems-icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    },
    {
      headers: {
        "content-type": "application/manifest+json; charset=utf-8",
        "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    },
  );
}
