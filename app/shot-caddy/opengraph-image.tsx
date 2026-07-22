import { createSocialImage, socialImageContentType, socialImageSize } from "../lib/create-social-image";

export const alt = "Shot Caddy golf-first experiences";
export const size = socialImageSize;
export const contentType = socialImageContentType;

export default function Image() {
  return createSocialImage({
    eyebrow: "Shot Caddy",
    title: "Make the round more memorable.",
    description: "Purpose-built disc golf and golf experiences designed around real rounds and real players.",
    accent: "#63e6ae",
    secondaryAccent: "#f5c86d",
  });
}
