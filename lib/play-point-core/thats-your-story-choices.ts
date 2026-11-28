import { FAMILY_STORY_CHOICES } from "./thats-your-story-family-choices";
import { CHRISTMAS_STORY_CHOICES } from "./thats-your-story-christmas-choices";
import type { StoryEdition } from "./thats-your-story-prompts";

// Keep each edition in the same append-only order as STORY_PROMPTS.
// Tests enforce complete coverage and the 240-character submission limit.
export const STORY_CHOICES: Record<StoryEdition, readonly (readonly string[])[]> = {
  family: FAMILY_STORY_CHOICES,
  christmas: CHRISTMAS_STORY_CHOICES,
};
export function storyChoicesFor(edition: StoryEdition, promptIndex: number): readonly string[] {
  return STORY_CHOICES[edition][promptIndex] ?? [];
}
