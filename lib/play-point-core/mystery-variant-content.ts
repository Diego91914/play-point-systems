export type VariantEvidenceCard = {
  title: string;
  publicText: string;
  privateByRole?: Record<string, string>;
};

export type VariantRoleTruth = {
  roleId: string;
  privateTruth: string[];
  coverStory?: string[];
};

export type VariantSupportRule = {
  id: string;
  title: string;
  text: string;
  targetRoles: string[];
  questionIds: string[];
  minEvidence: number;
  source?: "private-clue" | "personal-discovery" | "suspicious";
};

export type BlackwoodVariantContent = {
  variantId: string;
  culpritRoleId: string;
  roleTruths: VariantRoleTruth[];
  evidence: VariantEvidenceCard[];
  supportRules: VariantSupportRule[];
  branchSafetyNotes: string[];
};

export const BLACKWOOD_VARIANT_CONTENT: Record<string, BlackwoodVariantContent> = {
  "blackwood-business-partner": {
    variantId: "blackwood-business-partner",
    culpritRoleId: "partner",
    roleTruths: [
      {
        roleId: "partner",
        privateTruth: [
          "The missing Blackwood Holdings money was not an accounting mistake. You diverted it and altered records to hide what you had done.",
          "Adrian confronted you publicly around 10:20 but held back the most damaging proof.",
          "After going to the study, you realized Adrian had copied records that could expose you.",
          "Around 10:31 you returned to the library for a second private confrontation.",
          "The confrontation became fatal during the 10:31–10:35 window.",
          "You left by the rear route, crossed the porch in a dark outer layer, and returned toward the study.",
        ],
        coverStory: [
          "You claim the 10:20 argument was the last time you saw Adrian.",
          "You claim you remained in the study reviewing records through the critical window.",
          "You describe the copied bank packet as ordinary preparation for an outside audit.",
        ],
      },
      {
        roleId: "murderer",
        privateTruth: [
          "Your decades-old money dispute with Adrian is real, embarrassing, and unresolved enough to make you look dangerous.",
          "You drank whiskey earlier, but you did not kill Adrian in this variant.",
          "The blue ledger is truthful evidence of an old dispute, not the murder motive.",
        ],
      },
      {
        roleId: "sister",
        privateTruth: [
          "Your inheritance dispute remains real.",
          "Near 10:35 you see a dark-clothed figure moving from the library side toward the kitchen route, but cannot identify the face.",
        ],
      },
      {
        roleId: "chef",
        privateTruth: [
          "Adrian drank red wine, not whiskey.",
          "Shortly after the murder you notice the rear route disturbed and a damp torn corner from a copied bank packet near the back-door area.",
        ],
      },
    ],
    evidence: [
      {
        title: "The death window",
        publicText: "Adrian died in the library between 10:31 and 10:35. Earlier arguments alone do not establish who returned during that window.",
        privateByRole: { sister: "Your porch sighting happened near the end of the death window.", chef: "You were in the kitchen for most of the window." },
      },
      {
        title: "The torn bank-record fragment",
        publicText: "A damp torn corner from a copied Blackwood Holdings bank packet was found near the kitchen/back-door route. It matches copies handled in the downstairs study.",
        privateByRole: { chef: "You found the fragment after noticing the rear route had been disturbed." },
      },
      {
        title: "The rear route",
        publicText: "A dark-clothed figure crossed the back route near 10:35. A damp dress-shoe impression and the record fragment suggest movement from the library side toward the kitchen entrance.",
        privateByRole: { sister: "You saw the figure moving toward the kitchen side.", chef: "The back door was not fully latched shortly afterward." },
      },
      {
        title: "The company records",
        publicText: "A forensic review shows the missing company money was deliberately diverted. A copied packet in the study is missing the same corner found near the rear route. Adrian had prepared to force a private admission that night.",
      },
    ],
    supportRules: [
      { id: "partner_study_gap", title: "The study alibi has a gap", text: "Your questioning exposed that nobody can actually place the Business Partner continuously in the study during the fatal window.", targetRoles: ["partner"], questionIds: ["where", "alibi", "timeline", "opportunity", "after"], minEvidence: 0 },
      { id: "partner_records_link", title: "The records traveled", text: "The torn bank-record fragment connects materials handled by the Business Partner to the rear route after the murder.", targetRoles: ["partner", "chef"], questionIds: ["money", "secret", "heard", "after"], minEvidence: 1 },
      { id: "partner_back_route", title: "The rear route fits the missing minutes", text: "The 10:35 rear-route movement fits the Business Partner's unverified claim that they remained continuously in the study through the fatal window.", targetRoles: ["partner", "sister"], questionIds: ["door", "porch_route", "dark_jacket", "timeline"], minEvidence: 2 },
      { id: "partner_cleanup_trace", title: "The cleanup left a paper trace", text: "The damp record fragment suggests someone carrying the copied packet passed through the kitchen/back-door area after the fatal confrontation.", targetRoles: ["partner", "chef"], questionIds: ["door", "heard", "after", "money"], minEvidence: 2 },
    ],
    branchSafetyNotes: [
      "The old blue ledger remains truthful but is a red herring in this variant.",
      "The Old Friend's whiskey remains truthful and suspicious but is not the cleanup trace.",
      "No pre-lock fact may state that current company theft or old personal theft caused the murder.",
    ],
  },

  "blackwood-younger-sister": {
    variantId: "blackwood-younger-sister",
    culpritRoleId: "sister",
    roleTruths: [
      {
        roleId: "sister",
        privateTruth: [
          "The inheritance dispute was deeper than you admitted. You learned Adrian had prepared documents cutting you out because he believed you had hidden family assets.",
          "Your call to the family accountant around 10:25 was partly an attempt to confirm whether Adrian could make the change stick.",
          "You returned from the garden side and confronted Adrian privately in the library during the 10:31–10:35 window.",
          "The confrontation became fatal.",
          "You exited by the rear route, then returned outside so your garden-call story would appear continuous.",
        ],
        coverStory: [
          "You claim you remained outside on the accountant call through the critical window.",
          "You admit the inheritance fight but insist you only wanted transparency.",
          "You emphasize that the dark-clothed rear-route figure could have been anyone moving through the house.",
        ],
      },
      {
        roleId: "partner",
        privateTruth: [
          "Your current company-money dispute is real but unrelated to the killing in this variant.",
          "You are in or near the study during the fatal window and remain a strong financial red herring.",
        ],
      },
      {
        roleId: "murderer",
        privateTruth: [
          "Your old debt and blue-ledger history remain real, but you did not kill Adrian in this variant.",
          "Your whiskey glass remains suspicious but has an innocent explanation.",
        ],
      },
      {
        roleId: "chef",
        privateTruth: [
          "You notice the back door shift shortly after the critical window and later find a small torn edge of cream legal paper damp near the kitchen threshold.",
        ],
      },
    ],
    evidence: [
      { title: "The death window", publicText: "Adrian died in the library between 10:31 and 10:35. Several people have unverified minutes during that period." },
      { title: "The cream-paper fragment", publicText: "A damp torn edge of cream legal paper was recovered near the kitchen threshold. The paper stock matches the family inheritance documents used earlier that evening.", privateByRole: { chef: "You noticed the fragment only after the back door shifted." } },
      { title: "The garden-call gap", publicText: "Phone records confirm the Younger Sister called the family accountant, but the call briefly disconnected during the fatal window before reconnecting.", privateByRole: { sister: "You know the disconnection happened while you returned inside." } },
      { title: "The inheritance documents", publicText: "A draft inheritance revision shows Adrian intended to substantially reduce the Younger Sister's share and accuse her of concealing family assets. One page has a torn corner matching the rear-route fragment." },
    ],
    supportRules: [
      { id: "inheritance_document_link", title: "The torn document traveled", text: "The legal-paper fragment ties the inheritance documents to movement through the rear route after the murder.", targetRoles: ["sister", "chef"], questionIds: ["motive", "money", "secret", "heard"], minEvidence: 1 },
      { id: "garden_timeline_gap", title: "The garden alibi is not continuous", text: "Phone records and questioning expose a break in the accountant call during the exact death window.", targetRoles: ["sister"], questionIds: ["where", "alibi", "timeline", "opportunity", "after"], minEvidence: 2 },
      { id: "sister_return_route", title: "The rear route reaches the garden", text: "The porch/kitchen path provides a fast way to leave the library and return outside without crossing the main hall.", targetRoles: ["sister", "chef"], questionIds: ["door", "porch_route", "after", "heard"], minEvidence: 2 },
      { id: "family_accountant_pressure", title: "The accountant call raised the stakes", text: "Your questioning shows the call concerned whether Adrian's inheritance revision could take effect immediately, making the dispute more urgent than it first appeared.", targetRoles: ["sister"], questionIds: ["money", "motive", "secret", "relationship"], minEvidence: 3 },
    ],
    branchSafetyNotes: [
      "The Sister's original inheritance anger remains true in every branch.",
      "Before lock, the garden call may be known, but its fatal-window disconnection must remain undisclosed.",
      "The porch sighting must be authored carefully in this branch so the Sister is not required to falsely witness herself.",
    ],
  },

  "blackwood-private-chef": {
    variantId: "blackwood-private-chef",
    culpritRoleId: "chef",
    roleTruths: [
      {
        roleId: "chef",
        privateTruth: [
          "Adrian did more than end your employment. He accused you of using his household accounts to cover personal purchases and threatened to report you.",
          "You left the kitchen during a short service gap and confronted Adrian in the library during the 10:31–10:35 window.",
          "The confrontation became fatal.",
          "You returned through the rear route, rinsed away a kitchen-related trace, and resumed cleaning before anyone noticed the gap.",
        ],
        coverStory: [
          "You claim you remained in the kitchen continuously after 10:30.",
          "You admit Adrian fired you but deny any financial misconduct.",
          "You use your knowledge of everyone's drinks to keep attention on the whiskey glass and the Old Friend.",
        ],
      },
      {
        roleId: "murderer",
        privateTruth: [
          "You drank whiskey earlier and your old financial history with Adrian is real, making you an excellent red herring.",
          "You did not kill Adrian in this variant.",
        ],
      },
      {
        roleId: "partner",
        privateTruth: [
          "Your business dispute remains real but unrelated to the murder.",
          "Later you notice the back door not fully latched, corroborating post-murder movement.",
        ],
      },
      {
        roleId: "sister",
        privateTruth: [
          "From outside, you notice brief movement near the kitchen-side porch but cannot identify the person.",
        ],
      },
    ],
    evidence: [
      { title: "The death window", publicText: "Adrian died in the library between 10:31 and 10:35. The kitchen was nearby, but nobody continuously observed it during those minutes." },
      { title: "The service gap", publicText: "A kitchen timer and smart-speaker log show an unexplained pause in kitchen activity during the fatal window, despite the Chef's claim of continuous cleanup." },
      { title: "The rinsed prep trace", publicText: "A freshly rinsed prep cloth and sink residue contain a distinctive dark berry reduction served only with Adrian's private plate. The residue should not have reached the sink until later cleanup." },
      { title: "The household charges", publicText: "Receipts show personal purchases hidden inside household food accounts. Adrian had marked the charges and written that he intended to confront the Chef after dinner." },
    ],
    supportRules: [
      { id: "chef_service_gap", title: "The kitchen story has a gap", text: "The activity log contradicts the Chef's claim of continuous cleanup during the fatal window.", targetRoles: ["chef"], questionIds: ["where", "alibi", "timeline", "after"], minEvidence: 1 },
      { id: "kitchen_access_link", title: "The kitchen gives the fastest return route", text: "Questioning connects the library-to-porch route directly back to the Chef's claimed work area.", targetRoles: ["chef", "partner", "sister"], questionIds: ["door", "porch_route", "opportunity", "after"], minEvidence: 2 },
      { id: "glass_origin_link", title: "The sink evidence is broader than whiskey", text: "The Chef's focus on the whiskey glass distracts from a second freshly rinsed kitchen trace tied to Adrian's private service.", targetRoles: ["chef", "murderer"], questionIds: ["drink", "glass", "heard", "secret"], minEvidence: 2 },
      { id: "back_door_timing", title: "The disturbed door matches the service gap", text: "The back-door disturbance occurs immediately after the unexplained pause in kitchen activity.", targetRoles: ["chef", "partner", "sister"], questionIds: ["door", "timeline", "heard", "after"], minEvidence: 2 },
    ],
    branchSafetyNotes: [
      "Adrian's dislike of whiskey remains true; the whiskey glass is a red herring rather than the murder cleanup trace.",
      "The Chef's firing remains true in every branch, while the hidden household-charge accusation is variant-dependent.",
      "The generic voice draft may shape the hidden branch but is not proof of the household-account motive.",
      "Pre-lock evidence must not reveal the kitchen service gap or account fraud.",
    ],
  },
};

export function getBlackwoodVariantContent(variantId: string | undefined | null) {
  return variantId ? BLACKWOOD_VARIANT_CONTENT[variantId] ?? null : null;
}
