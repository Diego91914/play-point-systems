import { createSocialImage, socialImageContentType, socialImageSize } from "../../lib/create-social-image";

export const alt = "Play Point Trivia live hosted game";
export const size = socialImageSize;
export const contentType = socialImageContentType;

export default function Image() {
  return createSocialImage({
    eyebrow: "Play Point Trivia",
    title: "Trivia that feels alive in the room.",
    description: "Phone joining, host-controlled rounds, and speed scoring built for energetic group play.",
    accent: "#a78bfa",
    secondaryAccent: "#f5c86d",
  });
}
