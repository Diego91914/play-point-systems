export type MysteryBranchSignals = Record<string, string>;

export type MysteryCaseVariant = {
  id: string;
  title: string;
  culpritRoleId: string;
  releaseReady: boolean;
  motiveId: string;
  locationId: string;
  windowId: string;
  branchFit: (signals: MysteryBranchSignals) => number;
  solution: string;
};

/**
 * Case variants are authored truths, not random murderer swaps.
 * A variant may only become selectable when releaseReady is true.
 * Early player decisions can contribute hidden branch signals, but the client
 * must never be told that a normal investigative choice influenced the variant.
 */
export const BLACKWOOD_CASE_VARIANTS: MysteryCaseVariant[] = [
  {
    id: "blackwood-old-friend",
    title: "The Old Debt",
    culpritRoleId: "murderer",
    releaseReady: true,
    motiveId: "old_theft_exposed",
    locationId: "library",
    windowId: "1031_1035",
    branchFit: signals => signals.adrian_sealed_letter === "open" ? 20 : 10,
    solution: "Adrian confronted the Old Friend in the library with proof of a decades-old theft. The Old Friend killed Adrian during the 10:31–10:35 window, crossed the back porch in a dark jacket, and rinsed a whiskey glass in the kitchen before returning to the bathroom cover story.",
  },
  {
    id: "blackwood-business-partner",
    title: "The Missing Money",
    culpritRoleId: "partner",
    releaseReady: false,
    motiveId: "business_money",
    locationId: "library",
    windowId: "1031_1035",
    branchFit: signals => signals.adrian_sealed_letter === "seal" ? 20 : 0,
    solution: "Development variant. Adrian's confrontation over the missing Blackwood Holdings money becomes the fatal meeting. This variant remains disabled until its character memories, interrogation answers, evidence trail, private discoveries, scoring supports, and four-player solvability audit are complete.",
  },
];

export const DEFAULT_BLACKWOOD_VARIANT_ID = "blackwood-old-friend";

export function getMysteryCaseVariant(id: string | undefined | null) {
  return BLACKWOOD_CASE_VARIANTS.find(variant => variant.id === id) ?? BLACKWOOD_CASE_VARIANTS[0];
}

export function resolveBlackwoodVariant(signals: MysteryBranchSignals, currentVariantId?: string | null) {
  const current = currentVariantId ? getMysteryCaseVariant(currentVariantId) : null;
  if (current?.releaseReady) return current;

  const eligible = BLACKWOOD_CASE_VARIANTS.filter(variant => variant.releaseReady);
  if (!eligible.length) return getMysteryCaseVariant(DEFAULT_BLACKWOOD_VARIANT_ID);

  return [...eligible].sort((a, b) => b.branchFit(signals) - a.branchFit(signals))[0];
}
