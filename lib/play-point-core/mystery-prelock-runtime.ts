import type { MysteryAnswerKey, MysteryPromptAnswer } from "@/lib/play-point-core/mystery-variant-runtime";

const CORE_PRELOCK_MEMORY: Record<string, string[]> = {
  partner: [
    "You helped Adrian build Blackwood Holdings, and the company books have become a serious source of conflict.",
    "Around 10:20 you argued with Adrian in the library about missing company money.",
    "Around 10:25 you went toward the downstairs study with copied bank records.",
    "At 10:30 your story places you in the study reviewing those records.",
    "You privately contacted a forensic accountant because you believed the financial dispute was about to explode.",
    "You have reasons to protect yourself, but you do not yet know which private facts the investigation will make important.",
  ],
  sister: [
    "You and Adrian had a serious argument earlier about changes to the family inheritance.",
    "Around 10:25 you went outside to contact a family accountant.",
    "At 10:30 your story places you near the garden side of the property.",
    "You feared the inheritance fight involved more than Adrian had admitted.",
    "You are carrying a private family concern you have not shared with the room.",
    "Some details from the critical minutes are still unsettled in your own mind. Follow the phone when another memory surfaces.",
  ],
  chef: [
    "You handled dinner service and know Adrian's food and drink habits better than anyone in the room.",
    "Adrian drank red wine and disliked whiskey.",
    "At 10:30 your story places you in the kitchen handling cleanup.",
    "Adrian had told you that your work for him was ending after tonight.",
    "You noticed several small things around the service areas, but you have not yet decided which of them matter.",
    "Follow the phone if something from earlier in the evening comes back to you.",
  ],
  murderer: [
    "You and Adrian had known each other for decades, and an old financial dispute between you was never as cleanly resolved as either of you pretended.",
    "You drank whiskey earlier in the evening.",
    "Around 10:25 you went toward the downstairs bathroom area.",
    "Your story places you away from the library during the critical window.",
    "Adrian had recently become tense whenever the old dispute came up.",
    "You have personal history worth hiding even if the room does not yet know what it means.",
  ],
};

const SENSITIVE_MEMORY = /\b(murderer|murdered|killed|did not kill|blue ledger|old friend\. last chance|rinsed whiskey|dark-jacket|dark jacket|check the blue ledger)\b/i;

export function getPrelockRoleMemory(roleId: string | undefined, baseMemory: string[]) {
  if (!roleId) return baseMemory;
  const authored = CORE_PRELOCK_MEMORY[roleId];
  if (authored) return authored;
  return baseMemory.filter(line => !SENSITIVE_MEMORY.test(line));
}

const PRELOCK_OVERRIDES: Record<string, Partial<Record<MysteryAnswerKey, MysteryPromptAnswer>>> = {
  partner: {
    where: { mustReveal: "Your story places you in the downstairs study at 10:30, reviewing copied company records." },
    heard: { mustReveal: "From the study area you cannot identify anything you heard as the fatal confrontation." },
    money: { mustReveal: "You and Adrian had a serious current dispute over missing company money." },
    ledger: { mustReveal: "You know Adrian kept private financial records, but you do not yet know what any newly recovered record proves." },
  },
  sister: {
    where: { mustReveal: "Your story places you outside near the garden side at 10:30, dealing with a private family-accounting call." },
    heard: { mustReveal: "From outside you noticed activity around the rear side of the house, but nothing you can honestly identify yet as a specific person or route." },
    door: { mustReveal: "You cannot yet identify who used the rear door or porch during the critical minutes." },
    suspect: { mustReveal: "The financial conflicts around Adrian concern you, but you do not yet have enough verified information to name one person from the rear-side activity." },
    ledger: { mustReveal: "You had heard Adrian mention private financial records before, but you do not know what any recovered record means yet." },
  },
  chef: {
    where: { mustReveal: "Your story places you in the kitchen at 10:30 handling dinner cleanup." },
    heard: { mustReveal: "During the first part of the investigation, nothing you noticed in the kitchen lets you identify who was near the library." },
    door: { mustReveal: "You know the kitchen and rear entrance were in use during service, but you cannot yet connect the door to a specific person." },
    drink: { mustReveal: "Adrian drank red wine and disliked whiskey. You remember other people drinking different things." },
    ledger: { mustReveal: "You know nothing firsthand yet about Adrian's private financial records." },
  },
  murderer: {
    where: { mustReveal: "Your story places you near the downstairs bathroom area during the critical window." },
    motive: { mustReveal: "You and Adrian had an old financial disagreement that remained uncomfortable." },
    drink: { mustReveal: "You drank whiskey earlier in the evening." },
    ledger: { mustReveal: "You knew Adrian kept old financial records, but you have not seen enough verified evidence to say what they contain." },
    suspect: { mustReveal: "Several people had serious reasons to be angry with Adrian tonight." },
  },
  lawyer: {
    heard: { mustReveal: "You received legal and financial information from Adrian during the evening, but nothing you can responsibly treat as proof of the killer yet." },
    ledger: { mustReveal: "You know Adrian maintained private financial records. Their significance has not yet been established." },
  },
};

export function getPrelockAnswerOverride(roleId: string | undefined, answerKey: MysteryAnswerKey) {
  if (!roleId) return null;
  return PRELOCK_OVERRIDES[roleId]?.[answerKey] ?? null;
}

export const BLACKWOOD_PRELOCK_EVIDENCE = {
  title: "The death window",
  publicText: "Adrian died in the library between 10:31 and 10:35. Several people had unresolved conflicts with him, and no single early clue yet establishes who entered or left the library during those minutes.",
  privateByRole: {
    partner: "Your earlier argument ended before the fatal window. The exact continuity of your study timeline may still matter.",
    sister: "Your private family-accounting call overlaps the period investigators will be reconstructing. Keep following the phone as your own timeline becomes clearer.",
    chef: "You were handling kitchen cleanup around this period. Small service details may become important later.",
    murderer: "Your bathroom-area timeline will likely be tested closely because of your old conflict with Adrian.",
    lawyer: "Your legal context may help distinguish old disputes from current ones, but you do not yet have proof of which conflict became fatal.",
  } as Record<string, string>,
};
