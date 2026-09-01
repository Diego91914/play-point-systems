export type BlackwoodTimelineBeat = {
  time: string;
  location: string;
  truth: string;
};

export type BlackwoodRoleTimeline = {
  roleId: "murderer" | "partner" | "sister" | "chef";
  beats: BlackwoodTimelineBeat[];
};

export const BLACKWOOD_ALT_TIMELINES: Record<string, BlackwoodRoleTimeline[]> = {
  "blackwood-business-partner": [
    { roleId: "partner", beats: [
      { time: "10:20", location: "public rooms", truth: "Argues with Adrian over missing Blackwood Holdings money." },
      { time: "10:25", location: "downstairs study", truth: "Handles copied bank records and realizes Adrian has damaging proof." },
      { time: "10:31–10:35", location: "library", truth: "Returns for a private confrontation; Adrian is killed during this window." },
      { time: "~10:35", location: "rear route", truth: "Leaves toward the kitchen side in a dark outer layer, then returns toward the study." },
    ] },
    { roleId: "murderer", beats: [
      { time: "10:25–10:35", location: "downstairs bathroom area", truth: "Remains away from the library; the old debt and whiskey are genuine red herrings." },
    ] },
    { roleId: "sister", beats: [
      { time: "10:25–10:35", location: "garden/porch side", truth: "Is outside for the critical period and near 10:35 sees a dark-clothed figure moving toward the kitchen route without seeing the face." },
    ] },
    { roleId: "chef", beats: [
      { time: "10:25–10:35", location: "kitchen", truth: "Works in the kitchen for most of the fatal window." },
      { time: "after 10:35", location: "back-door area", truth: "Notices the disturbed route and damp torn bank-record fragment." },
    ] },
  ],

  "blackwood-younger-sister": [
    { roleId: "sister", beats: [
      { time: "~10:25", location: "garden side", truth: "Calls the family accountant about Adrian's inheritance revision." },
      { time: "10:31–10:35", location: "library", truth: "The call breaks; she returns inside, confronts Adrian, and kills him during the fatal window." },
      { time: "before call reconnects", location: "rear route to garden", truth: "Uses the rear route to return outside and make the call appear continuous." },
    ] },
    { roleId: "partner", beats: [
      { time: "10:25–10:35", location: "downstairs study", truth: "Remains in or near the study; the company-money dispute is real but unrelated to the killing." },
    ] },
    { roleId: "murderer", beats: [
      { time: "10:25–10:35", location: "downstairs bathroom area", truth: "The old debt and whiskey remain suspicious but do not place the Old Friend in the library." },
    ] },
    { roleId: "chef", beats: [
      { time: "10:25–10:35", location: "kitchen", truth: "Works near the kitchen and does not witness the killing." },
      { time: "after 10:35", location: "kitchen threshold", truth: "Notices the back door shift and later finds the damp cream-paper fragment." },
    ] },
  ],

  "blackwood-private-chef": [
    { roleId: "chef", beats: [
      { time: "before 10:30", location: "kitchen", truth: "Clears service while knowing Adrian has fired the Chef and discovered hidden personal charges." },
      { time: "10:31–10:35", location: "library", truth: "Leaves during the service gap, confronts Adrian over the threatened fraud exposure, and kills him." },
      { time: "immediately after", location: "rear route/kitchen", truth: "Returns by the rear route, rinses the service-related trace, and resumes cleanup." },
    ] },
    { roleId: "murderer", beats: [
      { time: "10:25–10:35", location: "downstairs bathroom area", truth: "The whiskey and old financial history remain genuine red herrings; the Old Friend does not kill Adrian." },
    ] },
    { roleId: "partner", beats: [
      { time: "10:25–10:35", location: "study/hall area", truth: "The business dispute remains real but separate from the household-account problem." },
      { time: "~10:42", location: "kitchen-side hall", truth: "Notices the back door is not fully latched." },
    ] },
    { roleId: "sister", beats: [
      { time: "10:25–10:35", location: "outside", truth: "From outside notices brief movement near the kitchen-side porch but cannot identify the person." },
    ] },
  ],
};

export function blackwoodTimelineFor(variantId: string, roleId: string) {
  return BLACKWOOD_ALT_TIMELINES[variantId]?.find(item => item.roleId === roleId) ?? null;
}
