export type MysteryBranchSignals = Record<string, string>;

export type MysteryCaseVariant = {
  id: string;
  title: string;
  culpritRoleId: string;
  culpritLabel: string;
  releaseReady: boolean;
  motiveId: string;
  locationId: string;
  windowId: string;
  correctSupportIds: string[];
  branchFit: (signals: MysteryBranchSignals) => number;
  solution: string;
};

export const BLACKWOOD_BRANCH_SIGNAL_KEYS = ["adrian_sealed_letter", "adrian_voice_draft"] as const;
export const BLACKWOOD_BRANCH_DEPTH = BLACKWOOD_BRANCH_SIGNAL_KEYS.length;

/**
 * Blackwood House uses a two-stage hidden branch tree.
 * Players only experience ordinary story decisions. After both branch signals
 * exist, the server may lock one of four fully authored truths.
 *
 * Path matrix:
 *   OPEN letter + LISTEN draft   -> Variant A
 *   OPEN letter + LEAVE draft    -> Variant C
 *   SEALED letter + LISTEN draft -> Variant D
 *   SEALED letter + LEAVE draft  -> Variant B
 *
 * A variant may only become live-selectable when releaseReady is true.
 * A scored support fact must also be encounterable on that path: an unopened
 * letter or unheard recording can shape the hidden branch, but its contents
 * can never be credited as evidence the investigators supposedly know.
 */
export const BLACKWOOD_CASE_VARIANTS: MysteryCaseVariant[] = [
  {
    id: "blackwood-old-friend",
    title: "The Old Debt",
    culpritRoleId: "murderer",
    culpritLabel: "The Old Friend",
    releaseReady: true,
    motiveId: "old_theft_exposed",
    locationId: "library",
    windowId: "1031_1035",
    correctSupportIds: ["bathroom_alibi_break", "whiskey_cleanup_link", "porch_route_link", "ledger_old_friend_link", "private_sister_timing", "private_chef_drink", "private_partner_door", "private_lawyer_ledger", "sealed_letter_old_theft"],
    branchFit: signals => signals.adrian_sealed_letter === "open" && signals.adrian_voice_draft === "listen" ? 100 : 0,
    solution: "Adrian confronted the Old Friend in the library with proof of a decades-old theft. The Old Friend killed Adrian during the 10:31–10:35 window, crossed the back porch in a dark jacket, and rinsed a whiskey glass in the kitchen before returning to the bathroom cover story.",
  },
  {
    id: "blackwood-business-partner",
    title: "The Missing Money",
    culpritRoleId: "partner",
    culpritLabel: "The Business Partner",
    releaseReady: false,
    motiveId: "business_money",
    locationId: "library",
    windowId: "1031_1035",
    correctSupportIds: ["partner_study_gap", "partner_records_link", "partner_back_route", "partner_cleanup_trace"],
    branchFit: signals => signals.adrian_sealed_letter === "seal" && signals.adrian_voice_draft === "leave" ? 100 : 0,
    solution: "Adrian discovered that the Business Partner had diverted Blackwood Holdings money and copied records that could prove it. The Partner returned to the library during the 10:31–10:35 window, killed Adrian during the second confrontation, and used the rear route back toward the study. A torn fragment from the copied bank packet connected that movement to the company records.",
  },
  {
    id: "blackwood-younger-sister",
    title: "The Inheritance Lie",
    culpritRoleId: "sister",
    culpritLabel: "The Younger Sister",
    releaseReady: false,
    motiveId: "inheritance",
    locationId: "library",
    windowId: "1031_1035",
    correctSupportIds: ["inheritance_document_link", "garden_timeline_gap", "sister_return_route", "family_accountant_pressure"],
    branchFit: signals => signals.adrian_sealed_letter === "open" && signals.adrian_voice_draft === "leave" ? 100 : 0,
    solution: "Adrian's inheritance revision threatened to cut the Younger Sister out and accuse her of concealing family assets. During a break in her accountant call she returned to the library, confronted Adrian during the 10:31–10:35 window, killed him, and used the rear route to return outside. The interrupted call and torn inheritance-paper fragment break the garden alibi.",
  },
  {
    id: "blackwood-private-chef",
    title: "The Final Service",
    culpritRoleId: "chef",
    culpritLabel: "The Private Chef",
    releaseReady: false,
    motiveId: "household_fraud_exposure",
    locationId: "library",
    windowId: "1031_1035",
    correctSupportIds: ["chef_service_gap", "kitchen_access_link", "glass_origin_link", "back_door_timing"],
    branchFit: signals => signals.adrian_sealed_letter === "seal" && signals.adrian_voice_draft === "listen" ? 100 : 0,
    solution: "Adrian had discovered that the Private Chef was hiding personal purchases in household accounts and was preparing to expose and report it. The firing raised the stakes, but the threatened fraud exposure was the real pressure behind the confrontation. The Chef left the kitchen during an unexplained service gap, confronted Adrian in the library during the 10:31–10:35 window, killed him, returned through the rear route, and rinsed away a service-related trace before resuming cleanup.",
  },
];

export const DEFAULT_BLACKWOOD_VARIANT_ID = "blackwood-old-friend";

export function getMysteryCaseVariant(id: string | undefined | null) {
  return BLACKWOOD_CASE_VARIANTS.find(variant => variant.id === id) ?? BLACKWOOD_CASE_VARIANTS[0];
}

export function blackwoodBranchProgress(signals: MysteryBranchSignals) {
  const completed = BLACKWOOD_BRANCH_SIGNAL_KEYS.filter(key => Boolean(signals[key])).length;
  return { completed, required: BLACKWOOD_BRANCH_DEPTH, readyToResolve: completed >= BLACKWOOD_BRANCH_DEPTH };
}

export function resolveBlackwoodVariant(signals: MysteryBranchSignals, currentVariantId?: string | null) {
  const current = currentVariantId ? BLACKWOOD_CASE_VARIANTS.find(variant => variant.id === currentVariantId) : null;
  if (current?.releaseReady) return current;

  const progress = blackwoodBranchProgress(signals);
  if (!progress.readyToResolve) return null;

  const ranked = [...BLACKWOOD_CASE_VARIANTS].sort((a, b) => b.branchFit(signals) - a.branchFit(signals));
  const authoredMatch = ranked[0];
  if (authoredMatch && authoredMatch.branchFit(signals) > 0 && authoredMatch.releaseReady) return authoredMatch;

  // Never leak an unfinished alternate truth into a live game.
  return getMysteryCaseVariant(DEFAULT_BLACKWOOD_VARIANT_ID);
}
