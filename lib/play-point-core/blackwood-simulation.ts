import { BLACKWOOD_CASE_VARIANTS, type MysteryCaseVariant } from "./mystery-case-variants";
import { BLACKWOOD_MINIMUM_PROOF_PLANS } from "./mystery-fairness";
import { questionsPerEvidenceRound } from "./mystery-pacing";
import { getBlackwoodVariantContent, type VariantSupportRule } from "./mystery-variant-content";

const CORE_ROLES = ["murderer", "partner", "sister", "chef"] as const;
const OPTIONAL_ROLES = ["lawyer", "assistant", "cousin", "neighbor"] as const;

export type BlackwoodFairnessSeat = {
  roleId: string;
  isCulprit: boolean;
  canReachMinimumProof: boolean;
  proofSupportIds: string[];
  proofTurnsNeeded: number;
  personalTurnsAvailable: number;
  requiresOptionalRole: boolean;
};

export type BlackwoodFairnessScenario = {
  playerCount: number;
  variantId: string;
  culpritRoleId: string;
  seats: BlackwoodFairnessSeat[];
  allInnocentsCanReachMinimumProof: boolean;
  optionalRolesRequiredForSolution: boolean;
};

type Rule = Pick<VariantSupportRule, "id" | "targetRoles" | "questionIds" | "minEvidence">;

const OLD_FRIEND_RULES: Rule[] = [
  { id: "bathroom_alibi_break", targetRoles: ["murderer"], questionIds: ["where", "alibi", "timeline", "opportunity", "after"], minEvidence: 2 },
  { id: "whiskey_cleanup_link", targetRoles: ["murderer", "chef"], questionIds: ["drink", "glass", "whiskey_owner"], minEvidence: 1 },
  { id: "porch_route_link", targetRoles: ["murderer", "sister"], questionIds: ["door", "porch_route", "dark_jacket", "heard"], minEvidence: 2 },
  { id: "ledger_old_friend_link", targetRoles: ["murderer", "partner", "lawyer"], questionIds: ["money", "old_money", "ledger", "ledger_entry", "final_pressure"], minEvidence: 3 },
];

function rolesForCount(playerCount: number) {
  if (!Number.isInteger(playerCount) || playerCount < 4 || playerCount > 8) throw new Error("Blackwood House supports 4–8 players.");
  return [...CORE_ROLES, ...OPTIONAL_ROLES.slice(0, playerCount - 4)];
}

function rulesFor(variant: MysteryCaseVariant): Rule[] {
  if (variant.id === "blackwood-old-friend") return OLD_FRIEND_RULES;
  return getBlackwoodVariantContent(variant.id)?.supportRules ?? [];
}

function canViewerEarnRule(viewerRoleId: string, activeRoles: string[], rule: Rule) {
  if (rule.minEvidence > 2) return false;
  return rule.targetRoles.some(targetRole => targetRole !== viewerRoleId && activeRoles.includes(targetRole));
}

export function simulateBlackwoodFairness(playerCount: number, variantId: string): BlackwoodFairnessScenario {
  const variant = BLACKWOOD_CASE_VARIANTS.find(item => item.id === variantId);
  if (!variant) throw new Error(`Unknown Blackwood variant: ${variantId}`);
  const proofPlan = BLACKWOOD_MINIMUM_PROOF_PLANS.find(item => item.variantId === variant.id);
  if (!proofPlan) throw new Error(`No minimum proof plan for ${variant.id}`);

  const activeRoles = rolesForCount(playerCount);
  const rules = rulesFor(variant);
  const proofRules = proofPlan.supportIds.map(id => rules.find(rule => rule.id === id)).filter((rule): rule is Rule => Boolean(rule));
  const personalTurnsAvailable = 4;

  const seats = activeRoles.map(roleId => {
    const isCulprit = roleId === variant.culpritRoleId;
    const reachableRules = proofRules.filter(rule => canViewerEarnRule(roleId, activeRoles, rule));
    const proofTurnsNeeded = new Set(reachableRules.map(rule => rule.id)).size;
    const requiresOptionalRole = reachableRules.some(rule => rule.targetRoles.every(target => !CORE_ROLES.includes(target as typeof CORE_ROLES[number])));
    return {
      roleId,
      isCulprit,
      canReachMinimumProof: isCulprit || (proofRules.length === 2 && proofTurnsNeeded >= 2 && proofTurnsNeeded <= personalTurnsAvailable),
      proofSupportIds: reachableRules.map(rule => rule.id),
      proofTurnsNeeded,
      personalTurnsAvailable,
      requiresOptionalRole,
    };
  });

  return {
    playerCount,
    variantId: variant.id,
    culpritRoleId: variant.culpritRoleId,
    seats,
    allInnocentsCanReachMinimumProof: seats.filter(seat => !seat.isCulprit).every(seat => seat.canReachMinimumProof),
    optionalRolesRequiredForSolution: proofRules.some(rule => rule.targetRoles.every(target => !CORE_ROLES.includes(target as typeof CORE_ROLES[number]))),
  };
}

export function auditAllBlackwoodFairness() {
  return BLACKWOOD_CASE_VARIANTS.flatMap(variant =>
    [4, 5, 6, 7, 8].map(playerCount => simulateBlackwoodFairness(playerCount, variant.id)),
  );
}

export function expectedBlackwoodInvestigationTurns(playerCount: number) {
  return questionsPerEvidenceRound(playerCount) * 4;
}
