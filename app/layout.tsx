import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Play Point Systems",
    template: "%s | Play Point Systems",
  },
  description: "Parent company for Shot Caddy, Play Point Records, and future live-play brands.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
