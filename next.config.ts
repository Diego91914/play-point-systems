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
      {
        source: "/play-amplified-sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/play-amplified-manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/play-amplified",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Shot Caddy gameplay is a Play Amplified game family. Legacy zone-level
      // shell destinations must return to the Play Amplified navigation rather
      // than opening a second My Games / Account / QuickScore experience.
      {
        source: "/shot-caddy/games",
        destination: "/games",
        permanent: false,
      },
      {
        source: "/shot-caddy/account",
        destination: "/account",
        permanent: false,
      },
      {
        source: "/shot-caddy/score",
        destination: "/live/quick-score",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        // The Play Amplified app owns /shot-caddy itself. Gameplay is proxied to
        // the dedicated Shot Caddy zone with an explicit shell marker so the
        // zone renders as a Play Amplified game family, not as a second PWA.
        {
          source: "/shot-caddy/:path+",
          destination: `${SHOT_CADDY_ZONE_ORIGIN}/shot-caddy/:path*?playAmplified=1`,
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
