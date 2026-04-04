import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Play Point Systems",
    template: "%s | Play Point Systems",
  },
  description: "Parent company for creator-led product and music divisions, created by Channing Stovall.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
