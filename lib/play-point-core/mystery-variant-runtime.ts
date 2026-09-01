import { getBlackwoodVariantContent } from "@/lib/play-point-core/mystery-variant-content";
import { getOptionalVariantAnswer, getOptionalVariantMemory } from "@/lib/play-point-core/mystery-optional-variant";

export type MysteryAnswerKey = "where" | "victim" | "heard" | "motive" | "after" | "before" | "secret" | "money" | "door" | "drink" | "ledger" | "suspect";
export type MysteryPromptAnswer = { mustReveal: string; mayHide?: string };

type AnswerOverrides = Partial<Record<MysteryAnswerKey, MysteryPromptAnswer>>;

const OVERRIDES: Record<string, Record<string, AnswerOverrides>> = {
  "blackwood-business-partner": {
    partner: {
      where: { mustReveal: "Say you were in the downstairs study at 10:30 and remained there through the critical window.", mayHide: "You returned to the library around 10:31." },
      victim: { mustReveal: "Say the 10:20 argument was the last time you saw Adrian.", mayHide: "You confronted him again privately around 10:31." },
      heard: { mustReveal: "Say you heard nothing from the study.", mayHide: "You know what happened because you returned to the library." },
      motive: { mustReveal: "Admit the missing company money caused a serious dispute.", mayHide: "You diverted the money and Adrian had proof." },
      after: { mustReveal: "For 10:31–10:35, insist you stayed in the study with the copied records, then continued working there afterward.", mayHide: "You were actually in the library during the fatal confrontation and used the rear route back toward the study afterward." },
      before: { mustReveal: "You left the public argument and went to the study with copied bank records." },
      secret: { mustReveal: "Say you had begun preparing for an outside audit.", mayHide: "The audit story helped hide your own diversion of funds." },
      money: { mustReveal: "Acknowledge serious missing-company-money questions.", mayHide: "You were responsible for the diversion." },
      door: { mustReveal: "Say the rear-route evidence does not prove you used it and that you only noticed the back door later around 10:42.", mayHide: "You used the rear route immediately after the fatal confrontation." },
      drink: { mustReveal: "You remember Adrian with red wine and the Old Friend with whiskey." },
      ledger: { mustReveal: "The blue ledger concerns an older personal dispute, not the current company books." },
      suspect: { mustReveal: "Point out that the Old Friend's old debt, the inheritance fight, and the Chef's firing are all real motives." },
    },
    murderer: {
      where: { mustReveal: "You were near the downstairs bathroom during the critical window." },
      after: { mustReveal: "For 10:31–10:35 you remained around the downstairs bathroom area, then returned without using the back route." },
      secret: { mustReveal: "Your old financial dispute with Adrian was uglier than you have admitted, but you believed it was behind you." },
      ledger: { mustReveal: "The blue ledger documents a real old dispute involving you. You are embarrassed by it, but it is not tonight's company-money problem." },
      drink: { mustReveal: "You drank whiskey earlier. You did not rinse a glass to hide a murder in this version." },
    },
    sister: {
      where: { mustReveal: "You were outside on the garden/porch side during the critical window." },
      after: { mustReveal: "Near 10:35, while still outside, you saw a dark-clothed figure moving from the library side toward the kitchen route but could not identify the face." },
    },
    chef: {
      where: { mustReveal: "You were working in the kitchen for most of the 10:31–10:35 window." },
      after: { mustReveal: "After 10:35 you noticed the rear route disturbed and then found a damp torn corner from a copied bank packet near the back-door area." },
      heard: { mustReveal: "Shortly after the critical window you noticed the rear route disturbed and later found a damp torn corner from a copied bank packet near the back-door area." },
      door: { mustReveal: "The back door was not fully latched, and the damp paper fragment was near that route." },
    },
  },

  "blackwood-younger-sister": {
    sister: {
      where: { mustReveal: "Say you were outside near the garden gate on a call at 10:30.", mayHide: "During a break in the call, you returned inside and went to the library during the fatal window." },
      victim: { mustReveal: "Say your last direct argument with Adrian was earlier over the inheritance.", mayHide: "You confronted him again privately in the library." },
      heard: { mustReveal: "Say you heard nothing clearly from the garden side.", mayHide: "You were inside during part of the fatal window." },
      motive: { mustReveal: "Admit the inheritance fight was serious and that you feared being cut out.", mayHide: "You learned Adrian planned to accuse you of concealing family assets." },
      after: { mustReveal: "For 10:31–10:35, claim you remained outside dealing with the accountant call and stayed outside afterward.", mayHide: "The call broke while you entered the library; after the confrontation you used the rear route to return outside before reconnecting." },
      before: { mustReveal: "You went outside around 10:25 to call the family accountant." },
      secret: { mustReveal: "The call concerned whether Adrian's inheritance changes could take effect.", mayHide: "You were trying to confirm how badly the new documents could hurt you." },
      money: { mustReveal: "The inheritance dispute could cost you substantially.", mayHide: "The revised papers also accused you of hiding family assets." },
      door: { mustReveal: "Say the rear route reaches the garden side but does not prove who used it; insist you stayed outside.", mayHide: "You used the rear route yourself to get back outside after killing Adrian." },
      drink: { mustReveal: "You remember Adrian drinking red wine, not whiskey." },
      ledger: { mustReveal: "The blue ledger concerns an older dispute and does not resolve the inheritance issue." },
      suspect: { mustReveal: "Point out that the Business Partner and Old Friend both had serious financial conflicts with Adrian." },
    },
    chef: {
      where: { mustReveal: "You were working near the kitchen during the 10:31–10:35 window and did not witness the killing." },
      after: { mustReveal: "After 10:35 you noticed the back door shift and later found a damp edge of cream legal paper near the kitchen threshold." },
      heard: { mustReveal: "Shortly after the critical window you noticed the back door shift and later found a damp edge of cream legal paper near the kitchen threshold." },
      door: { mustReveal: "The back door had been disturbed, and the cream-paper fragment was near the threshold." },
    },
    partner: {
      where: { mustReveal: "You were in or near the downstairs study during the 10:31–10:35 window." },
      after: { mustReveal: "You remained around the study after the critical window; your company-money dispute was real but separate from the inheritance fight." },
      money: { mustReveal: "Your company-money dispute was serious, but it is separate from the inheritance documents." },
    },
    murderer: {
      where: { mustReveal: "You were near the downstairs bathroom during the critical window." },
      after: { mustReveal: "For 10:31–10:35 you remained around the downstairs bathroom area and did not use the rear route." },
      ledger: { mustReveal: "The old blue-ledger dispute involving you is real, but it is separate from tonight's inheritance fight." },
      drink: { mustReveal: "You drank whiskey earlier. The glass makes you look suspicious, but you did not kill Adrian in this version." },
    },
  },

  "blackwood-private-chef": {
    chef: {
      where: { mustReveal: "Say you were cleaning in the kitchen continuously through the critical window.", mayHide: "You left during a short service gap and went to the library." },
      victim: { mustReveal: "Say you last saw Adrian around 10:15 carrying red wine toward the library.", mayHide: "You confronted him again during the fatal window." },
      heard: { mustReveal: "Say you heard nothing unusual while cleaning.", mayHide: "You know what happened because you were in the library." },
      motive: { mustReveal: "Admit Adrian ended your employment after tonight.", mayHide: "He also accused you of hiding personal purchases in household accounts and threatened to report you." },
      after: { mustReveal: "For 10:31–10:35, insist you stayed in the kitchen cleaning and continued cleanup afterward.", mayHide: "You left during the service gap, killed Adrian in the library, returned through the rear route, and rinsed away a kitchen-related trace." },
      before: { mustReveal: "You were clearing dinner service and cleaning before 10:30." },
      secret: { mustReveal: "Adrian fired you.", mayHide: "He had also discovered questionable household-account charges tied to you." },
      money: { mustReveal: "Losing Adrian as a client would cost you income.", mayHide: "The household-account accusation could also damage your career." },
      door: { mustReveal: "Say the service gap and rear-route evidence do not prove you left the kitchen; you only noticed the back door was not fully latched later.", mayHide: "You used that route immediately after the fatal confrontation." },
      drink: { mustReveal: "Adrian drank red wine and disliked whiskey. The Old Friend drank whiskey earlier.", mayHide: "You are using the whiskey clue to keep attention away from your own sink trace." },
      ledger: { mustReveal: "You know nothing firsthand about the old blue ledger." },
      suspect: { mustReveal: "Point investigators toward the Old Friend's whiskey and old debt, or the Business Partner's money dispute." },
    },
    murderer: {
      where: { mustReveal: "You were near the downstairs bathroom during the critical window." },
      after: { mustReveal: "For 10:31–10:35 you remained around the downstairs bathroom area; your whiskey and old debt are real but you did not use the rear route." },
      ledger: { mustReveal: "The old ledger dispute involving you is real but unrelated to the Chef's household-account problem." },
      drink: { mustReveal: "You drank whiskey earlier, which makes the rinsed-glass clue look bad for you." },
    },
    partner: {
      where: { mustReveal: "You were in the study/hall area during the 10:31–10:35 window." },
      after: { mustReveal: "You remained around the study/hall area; around 10:42 you noticed the kitchen back door partly open." },
      door: { mustReveal: "Around 10:42 you noticed the kitchen back door partly open." },
      money: { mustReveal: "Your current company-money dispute is real but separate from household food-account charges." },
    },
    sister: {
      where: { mustReveal: "You were outside during the 10:31–10:35 window." },
      after: { mustReveal: "From outside you noticed brief movement near the kitchen-side porch but could not identify the person." },
      heard: { mustReveal: "From outside you noticed brief movement near the kitchen-side porch, but you could not identify who it was." },
      door: { mustReveal: "You saw movement near the kitchen-side rear route, but not enough to identify the person." },
    },
  },
};

export function getVariantAnswerOverride(variantId: string | undefined | null, roleId: string | undefined, answerKey: MysteryAnswerKey) {
  if (!variantId || !roleId) return null;
  return OVERRIDES[variantId]?.[roleId]?.[answerKey] ?? getOptionalVariantAnswer(variantId, roleId, answerKey);
}

export function getVariantRoleMemory(variantId: string | undefined | null, roleId: string | undefined, baseMemory: string[]) {
  if (!variantId || !roleId) return baseMemory;
  const truth = getBlackwoodVariantContent(variantId)?.roleTruths.find(item => item.roleId === roleId);
  if (truth) {
    return [
      ...truth.privateTruth,
      ...(truth.coverStory?.map(item => `COVER STORY: ${item}`) ?? []),
    ];
  }

  // Optional roles need authored branch-safe memories too. Without this fallback,
  // their original Variant A memories can leak blue-ledger or Old-Friend facts
  // into Business Partner, Sister, or Chef cases after the truth locks.
  return getOptionalVariantMemory(variantId, roleId) ?? baseMemory;
}

export function getVariantEvidence(variantId: string | undefined | null) {
  return getBlackwoodVariantContent(variantId)?.evidence ?? null;
}
