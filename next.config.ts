import type { NextConfig } from "next";

// The Play Amplified front door must proxy Shot Caddy to the dedicated zone
// deployment, never back to a public custom domain. Allowing a production env
// override here can create a self-referential rewrite loop when it points at
// playamplified.com or shotcaddy.net.
const SHOT_CADDY_ZONE_ORIGIN = "https://shot-caddy-web.vercel.app";

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
  async headers() {
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: [
          {
            key: "Content-Type",
            value: "application/json; charset=utf-8",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Play Amplified now owns /account itself. Shot Caddy remains mounted
        // only under /shot-caddy and through its legacy API namespaces.
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
