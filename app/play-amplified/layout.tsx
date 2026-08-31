import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://playamplified.com"),
  applicationName: "Play Amplified",
  title: {
    absolute: "Play Amplified | Phones in the game. People in the moment.",
  },
  description:
    "Play Amplified uses the phones people already have to create more interaction with the people they are already with — either by starting a shared game or adding a new game layer to something they are already playing.",
  alternates: {
    canonical: "https://playamplified.com",
  },
  openGraph: {
    type: "website",
    url: "https://playamplified.com",
    siteName: "Play Amplified",
    title: "Play Amplified",
    description: "Phones in the game. People in the moment.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Play Amplified",
    description: "Phones in the game. People in the moment.",
  },
};

export default function PlayAmplifiedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
