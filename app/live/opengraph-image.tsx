import { createSocialImage, socialImageContentType, socialImageSize } from "../lib/create-social-image";

export const alt = "Play Point Live scoring and venue experiences";
export const size = socialImageSize;
export const contentType = socialImageContentType;

export default function Image() {
  return createSocialImage({
    eyebrow: "Play Point Live",
    title: "Keep score. Share the moment.",
    description: "Fast live scoreboards for backyards, clubs, recurring events, and venue game nights.",
    accent: "#52d9ff",
    secondaryAccent: "#67e8b5",
  });
}
