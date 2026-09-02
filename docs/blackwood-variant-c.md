# Blackwood House — Variant C: The Inheritance Lie

Status: **code-audited / not selectable in live games / live playtest pending**

## Core truth

**Culprit:** The Younger Sister  
**Motive:** Adrian prepared an inheritance revision that substantially reduced her share and accused her of concealing family assets.  
**Fatal location:** Library  
**Fatal window:** 10:31–10:35 p.m.  
**Aftermath:** She returns from the garden side during a break in her accountant call, confronts Adrian, kills him, and uses the rear route to get back outside before reconnecting the call.

## Branch path

**OPEN letter + LEAVE voice draft** → Variant C once release-ready.

The first hidden decision does not determine the culprit. The second hidden decision completes the 2×2 path. Players never see this matrix. The unopened/unheard branch artifact can shape branch selection, but artifact content that players did not encounter is never scored as proof.

## Branch-safe facts

Before the case locks, all of the following may be true without forcing Variant C:
- Adrian dies in the library between 10:31 and 10:35.
- The Sister and Adrian had an inheritance dispute.
- The Sister went outside to call a family accountant.
- The Business Partner had a serious company-money conflict.
- The Old Friend had a genuine old-debt dispute.
- The Chef had just been fired.
- A rear route connects the library side to the kitchen/garden side.

The phone must not reveal the fatal-window call disconnection, the concealed-asset accusation, or the cream-paper fragment until after the branch is locked.

## Four-player clue chain

1. **Death window** — establishes the critical four minutes.
2. **Cream legal-paper fragment** — a damp torn fragment near the kitchen threshold matches the inheritance documents.
3. **Garden-call gap** — phone records show the Sister's accountant call disconnected during the fatal window, then reconnected.
4. **Inheritance revision** — Adrian planned to reduce her share and accuse her of concealing assets; one page is missing the fragment found on the rear route.

## Correct support paths

- `inheritance_document_link`
- `garden_timeline_gap`
- `sister_return_route`
- `family_accountant_pressure`

No sealed-letter or voice-draft artifact is a scored support fact in this path. Conviction target remains 12 points with correct culprit required, 8/12 minimum, and at least two correct support links.

## Critical logic rule

The Sister cannot remain the original porch witness in this variant. Her interrogation answers and private memory instead reflect that she used the rear route herself. Other core players and physical evidence carry the route corroboration.

## Red herrings that stay truthful

- Business Partner's company dispute
- Old Friend's blue-ledger debt and whiskey
- Chef's firing
- optional legal/property disputes

## Release gate

Automated/code audit now passes for:
- variant-aware Sister answers and private memory
- no self-witness contradiction
- legal-paper / call-gap evidence chain
- evidence-gated follow-up wording
- encounterable support facts only
- branch-safe pre-lock facts
- 4–8 player fairness simulation
- production build gate

**Still required before `releaseReady = true`:** a successful real multi-device live playtest covering OPEN + LEAVE, the full investigation/evidence sequence, Build Your Case submissions, reveal, and Start Over.
