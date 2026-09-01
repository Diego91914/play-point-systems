import type { MysteryAnswerKey, MysteryPromptAnswer } from "@/lib/play-point-core/mystery-variant-runtime";

type OptionalRoleId = "lawyer" | "assistant" | "cousin" | "neighbor";
type OptionalAnswers = Partial<Record<MysteryAnswerKey, MysteryPromptAnswer>>;

type OptionalVariantPack = {
  memories: Record<OptionalRoleId, string[]>;
  answers: Record<OptionalRoleId, OptionalAnswers>;
};

const COMMON = {
  lawyer: [
    "At 10:05 you met Adrian about the revised will and several financial irregularities.",
    "At 10:30 you were in the dining room with your briefcase.",
    "You know details of the revised will that the family does not know yet.",
    "At 10:36 the Neighbor saw you in the dining room.",
    "You did not kill Adrian.",
  ],
  assistant: [
    "At 10:18 you saw Adrian alone in the library, visibly tense.",
    "At 10:30 you were upstairs delivering a folder.",
    "Shortly before 10:32 you heard the library door close downstairs.",
    "Your secret: you copied private files because you learned Adrian planned to fire you.",
    "You did not kill Adrian.",
  ],
  cousin: [
    "At 10:12 you confronted Adrian about an unpaid personal loan.",
    "At 10:30 you were in the billiard room.",
    "You are in deeper financial trouble than anyone realizes.",
    "Your loan dispute is real, but you did not kill Adrian.",
  ],
  neighbor: [
    "At 10:10 you saw Adrian near the staircase.",
    "At 10:30 you were in the front sitting room.",
    "Around 10:34 you heard a heavy thump from the library side of the house.",
    "At 10:36 you saw the Family Lawyer in the dining room.",
    "Your secret: you had threatened Adrian with an expensive lawsuit. You did not kill him.",
  ],
} satisfies Record<OptionalRoleId, string[]>;

const COMMON_ANSWERS: Record<OptionalRoleId, OptionalAnswers> = {
  lawyer: {
    where: { mustReveal: "You were in the dining room with your briefcase at 10:30, and the Neighbor saw you there around 10:36." },
    victim: { mustReveal: "You last saw Adrian face-to-face around 10:05 while discussing legal and financial matters." },
    heard: { mustReveal: "You did not witness the fatal confrontation. You remained around the dining room and legal papers." },
    motive: { mustReveal: "You had no personal feud, but your knowledge of the revised will and finances makes you look involved." },
    after: { mustReveal: "You remained in or near the dining room gathering papers; the Neighbor saw you there around 10:36." },
    before: { mustReveal: "You were organizing legal papers before 10:30." },
    secret: { mustReveal: "You know details of the revised will that the family does not know yet." },
    money: { mustReveal: "You handled Adrian's legal and financial documents but were not personally owed money." },
    door: { mustReveal: "You did not use the back door and have no firsthand porch information." },
    drink: { mustReveal: "You remember Adrian drinking red wine, not whiskey." },
    ledger: { mustReveal: "You know Adrian kept private financial records, but no single old record proves what happened tonight." },
    suspect: { mustReveal: "Several current disputes were serious enough to deserve investigation; you cannot identify the killer from your legal knowledge alone." },
  },
  assistant: {
    where: { mustReveal: "You were in the upstairs hall at 10:30." },
    victim: { mustReveal: "You last saw Adrian around 10:18 in the library." },
    heard: { mustReveal: "You heard the library door close shortly before 10:32, but could not identify who caused it." },
    motive: { mustReveal: "You had learned Adrian planned to fire you next week." },
    after: { mustReveal: "You finished delivering the folder upstairs and came back down several minutes later." },
    before: { mustReveal: "You were carrying a folder upstairs just before 10:30." },
    secret: { mustReveal: "You copied private files after learning you were about to be fired." },
    money: { mustReveal: "Losing your job mattered financially, but you were not part of the central financial dispute being uncovered tonight." },
    door: { mustReveal: "You have no firsthand porch knowledge, but you heard the library door close shortly before 10:32." },
    drink: { mustReveal: "You remember Adrian with red wine in the library earlier." },
    ledger: { mustReveal: "You knew Adrian kept private records, but you do not know which record matters to the murder." },
    suspect: { mustReveal: "Someone was active around the library shortly before 10:32. The timing matters more than any assumption about identity." },
  },
  cousin: {
    where: { mustReveal: "You were in the billiard room at 10:30." },
    victim: { mustReveal: "You last saw Adrian around 10:12 when you demanded repayment." },
    heard: { mustReveal: "You noticed people moving in the hall later, but you did not see anyone enter the library during the fatal window." },
    motive: { mustReveal: "Adrian owed you a large amount of money and you desperately needed it." },
    after: { mustReveal: "You stayed around the billiard room and later noticed movement in the hall." },
    before: { mustReveal: "You were brooding over the unpaid loan before 10:30." },
    secret: { mustReveal: "You are in serious financial trouble." },
    money: { mustReveal: "Adrian owed you a large personal loan, separate from the other financial conflicts being investigated." },
    door: { mustReveal: "You did not use the back door." },
    drink: { mustReveal: "You saw Adrian with red wine earlier." },
    ledger: { mustReveal: "You knew Adrian kept financial records, but you do not know which records connect to the murder." },
    suspect: { mustReveal: "Several people looked angry that night. You did not see enough to identify who entered the library." },
  },
  neighbor: {
    where: { mustReveal: "You were in the front sitting room at 10:30." },
    victim: { mustReveal: "You last saw Adrian around 10:10 near the staircase." },
    heard: { mustReveal: "Around 10:34 you heard a heavy thump from the library side of the house." },
    motive: { mustReveal: "You had an ugly property dispute and had threatened a lawsuit." },
    after: { mustReveal: "You stayed near the sitting room, then saw the Family Lawyer in the dining room around 10:36." },
    before: { mustReveal: "You were alone in the front sitting room before 10:30." },
    secret: { mustReveal: "You recently threatened Adrian with a costly lawsuit." },
    money: { mustReveal: "The property dispute could cost substantial money, but it is separate from the other financial conflicts in the house." },
    door: { mustReveal: "You were nowhere near the back door." },
    drink: { mustReveal: "You remember Adrian with red wine, not whiskey." },
    ledger: { mustReveal: "You know Adrian kept financial records but have no firsthand knowledge of which records matter." },
    suspect: { mustReveal: "The heavy thump near 10:34 makes whoever could reach the library during that window especially important." },
  },
};

const PACKS: Record<string, OptionalVariantPack> = {
  "blackwood-business-partner": {
    memories: {
      ...COMMON,
      cousin: [...COMMON.cousin, "Around 10:33 you saw the Business Partner in or near the hall, but you cannot say where that person had been immediately before."],
    },
    answers: {
      ...COMMON_ANSWERS,
      cousin: {
        ...COMMON_ANSWERS.cousin,
        heard: { mustReveal: "Around 10:33 you saw the Business Partner in or near the hall looking tense, but you did not see where that person came from." },
        suspect: { mustReveal: "The Business Partner looked tense around 10:33, but that observation alone does not prove where they had been." },
      },
    },
  },
  "blackwood-younger-sister": {
    memories: COMMON,
    answers: COMMON_ANSWERS,
  },
  "blackwood-private-chef": {
    memories: COMMON,
    answers: COMMON_ANSWERS,
  },
};

export function getOptionalVariantMemory(variantId: string | undefined | null, roleId: string | undefined) {
  if (!variantId || !roleId || !(roleId in COMMON)) return null;
  return PACKS[variantId]?.memories[roleId as OptionalRoleId] ?? null;
}

export function getOptionalVariantAnswer(variantId: string | undefined | null, roleId: string | undefined, answerKey: MysteryAnswerKey) {
  if (!variantId || !roleId || !(roleId in COMMON)) return null;
  return PACKS[variantId]?.answers[roleId as OptionalRoleId]?.[answerKey] ?? null;
}
