import { createSocialImage, socialImageContentType, socialImageSize } from "../lib/create-social-image";

export const alt = "Play Point Systems products";
export const size = socialImageSize;
export const contentType = socialImageContentType;

export default function Image() {
  return createSocialImage({
    eyebrow: "Products",
    title: "Simple to start. Memorable to play.",
    description: "Live scoring, hosted trivia, and golf-first experiences built for the way people actually play.",
    accent: "#62d8ff",
    secondaryAccent: "#f6c86f",
  });
}
