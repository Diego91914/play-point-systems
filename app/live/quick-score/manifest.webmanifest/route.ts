import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(
    {
      name: "Quick Score by Play Point Live",
      short_name: "Quick Score",
      description: "A fast scoreboard for backyard games, clubs, and event nights.",
      start_url: "/live/quick-score",
      scope: "/live/quick-score/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#07111d",
      theme_color: "#07111d",
      categories: ["sports", "games", "utilities"],
      icons: [
        {
          src: "/images/pps-logo.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/images/pps-logo.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
      },
    }
  );
}
