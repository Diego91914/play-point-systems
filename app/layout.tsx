import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";

const displayFont = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.playpointsystems.com"),
  applicationName: "Play Point Systems",
  title: {
    default: "Play Point Systems",
    template: "%s | Play Point Systems",
  },
  description: "Interactive games, live scoring, golf-first products, and original music created by Play Point Systems.",
  keywords: ["live scoring", "group games", "trivia", "disc golf", "Shot Caddy", "Play Point Live", "Play Point Records"],
  authors: [{ name: "Channing Stovall" }],
  creator: "Channing Stovall",
  icons: {
    icon: [
      { url: "/images/brand/play-point-systems-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/brand/play-point-systems-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/images/brand/play-point-systems-icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: "https://www.playpointsystems.com",
    siteName: "Play Point Systems",
    title: "Play Point Systems",
    description: "Games, experiences, and music built to bring people together.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Play Point Systems",
    description: "Games, experiences, and music built to bring people together.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Play Point Systems LLC",
    url: "https://www.playpointsystems.com",
    logo: "https://www.playpointsystems.com/images/brand/play-point-systems-logo.png",
    founder: {
      "@type": "Person",
      name: "Channing Stovall",
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "channing@playpointsystems.com",
      telephone: "+1-256-649-7529",
      contactType: "customer support",
    },
  };

  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        {children}
      </body>
    </html>
  );
}
