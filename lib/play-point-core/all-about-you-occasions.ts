import { ALL_ABOUT_YOU_PROMPTS, ALL_ABOUT_YOU_ROUND_ORDER, type AllAboutYouRoundType } from "@/lib/play-point-core/all-about-you-prompts";

export type AllAboutYouOccasion = "birthday" | "celebration" | "just-because";

const THEMED_PROMPTS: Record<Exclude<AllAboutYouOccasion, "just-because">, Partial<Record<AllAboutYouRoundType, readonly string[]>>> = {
  birthday: {
    pick: ["pick-celebrate", "pick-keepsake"],
    finish: ["finish-next-year", "finish-childhood", "finish-proud"],
    rank: ["rank-party", "rank-gift", "rank-legacy"],
    who: ["who-story", "who-surprise"],
    memory: ["memory-first", "memory-proud", "memory-grateful"],
  },
  celebration: {
    pick: ["pick-celebrate", "pick-photo", "pick-keepsake"],
    finish: ["finish-proud", "finish-next-year", "finish-known-for"],
    rank: ["rank-party", "rank-gift", "rank-legacy"],
    who: ["who-surprise", "who-story"],
    memory: ["memory-proud", "memory-meaning", "memory-grateful"],
  },
};

function shuffle<T>(items: readonly T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

export function cleanAllAboutYouOccasion(value: unknown): AllAboutYouOccasion {
  return value === "birthday" || value === "celebration" || value === "just-because" ? value : "birthday";
}

export function chooseAllAboutYouPrompts(occasion: AllAboutYouOccasion) {
  const themedRounds = occasion === "just-because" ? new Set<AllAboutYouRoundType>() : new Set(shuffle(ALL_ABOUT_YOU_ROUND_ORDER).slice(0, 2));
  const themedIds = occasion === "just-because" ? {} : THEMED_PROMPTS[occasion];

  return ALL_ABOUT_YOU_ROUND_ORDER.map(type => {
    const basePool = ALL_ABOUT_YOU_PROMPTS.filter(prompt => prompt.type === type);
    if (!themedRounds.has(type)) return shuffle(basePool)[0]?.id ?? "";
    const ids = themedIds[type] ?? [];
    const themedPool = basePool.filter(prompt => ids.includes(prompt.id));
    return shuffle(themedPool.length ? themedPool : basePool)[0]?.id ?? "";
  });
}

export function allAboutYouOccasionLabel(occasion: AllAboutYouOccasion) {
  if (occasion === "birthday") return "Birthday";
  if (occasion === "celebration") return "Celebration";
  return "Just Because";
}
