import type { NextConfig } from "next";

const SHOT_CADDY_ZONE_ORIGIN =
  process.env.SHOT_CADDY_ZONE_ORIGIN ??
  "https://shot-caddy-web.vercel.app";

const shotCaddyApiNamespaces = [
  "account",
  "auth",
  "checkout",
  "classic",
  "clubhouses",
  "codes",
  "course-challenges",
  "courses",
  "csp",
  "entitlements",
  "events",
  "health",
  "play-point-live",
  "private-access",
  "purchases",
  "quest",
  "rounds",
  "session-codes",
  "sessions",
  "sportsbook",
  "tools",
  "trial",
  "waitlist",
  "webhooks",
] as const;

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/shot-caddy/:path*",
          destination: `${SHOT_CADDY_ZONE_ORIGIN}/shot-caddy/:path*`,
        },
        ...shotCaddyApiNamespaces.map((namespace) => ({
          source: `/api/${namespace}/:path*`,
          destination: `${SHOT_CADDY_ZONE_ORIGIN}/shot-caddy/api/${namespace}/:path*`,
        })),
      ],
    };
  },
};

export default nextConfig;
