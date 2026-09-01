export type MinimumProofPlan = {
  variantId: string;
  supportIds: [string, string];
  rationale: string;
};

/**
 * Release gate: every Blackwood truth must have at least one two-link proof path
 * available by Evidence 3 or earlier. With the scalable pacing model, every
 * player receives exactly four investigator turns, so two can build a
 * conviction-grade support chain while two remain available for alternate
 * theories, red herrings, or follow-up pressure. No proof plan may require an
 * optional 5th–8th character.
 */
export const BLACKWOOD_MINIMUM_PROOF_PLANS: MinimumProofPlan[] = [
  {
    variantId: "blackwood-old-friend",
    supportIds: ["whiskey_cleanup_link", "porch_route_link"],
    rationale: "Question the drink/cleanup evidence, then the porch route. Neither depends on an optional role or the sealed letter.",
  },
  {
    variantId: "blackwood-business-partner",
    supportIds: ["partner_study_gap", "partner_records_link"],
    rationale: "Break the study alibi, then connect the copied bank records to the rear-route trace.",
  },
  {
    variantId: "blackwood-younger-sister",
    supportIds: ["inheritance_document_link", "garden_timeline_gap"],
    rationale: "Connect the torn legal paper to the inheritance conflict, then break the continuity of the garden-call alibi.",
  },
  {
    variantId: "blackwood-private-chef",
    supportIds: ["chef_service_gap", "kitchen_access_link"],
    rationale: "Establish the unexplained kitchen service gap, then connect kitchen access to the fastest rear-route return.",
  },
];

export function minimumProofPlanFor(variantId: string) {
  return BLACKWOOD_MINIMUM_PROOF_PLANS.find(plan => plan.variantId === variantId) ?? null;
}
