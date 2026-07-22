import { createSocialImage, socialImageContentType, socialImageSize } from "../lib/create-social-image";

export const alt = "Play Point Records original music";
export const size = socialImageSize;
export const contentType = socialImageContentType;

export default function Image() {
  return createSocialImage({
    eyebrow: "Play Point Records",
    title: "Songs built around truth and testimony.",
    description: "Country and Christian storytelling from Channing Stovall and Play Point Records.",
    accent: "#f2bd66",
    secondaryAccent: "#70c9ff",
  });
}
