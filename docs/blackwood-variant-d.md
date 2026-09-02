# Blackwood House — Variant D: The Final Service

Status: **code-audited / not selectable in live games / live playtest pending**

## Core truth

**Culprit:** The Private Chef  
**Motive:** Adrian discovered the Chef had hidden personal purchases inside household food accounts and planned to report it after already ending the Chef's employment.  
**Fatal location:** Library  
**Fatal window:** 10:31–10:35 p.m.  
**Aftermath:** The Chef leaves the kitchen during a short service gap, confronts Adrian in the library, kills him, returns by the rear route, rinses a kitchen-related trace, and resumes cleanup.

## Branch path

**SEALED letter + LISTEN voice draft** → Variant D once release-ready.

The Chef's voice-draft choice is an ordinary private story decision. The player is never told it is Branch Point 2. The recording is intentionally generic; it can shape the hidden branch but is **not** a scored proof fact for the household-account motive.

## Branch-safe facts

Before lock:
- Adrian drank red wine and disliked whiskey.
- The Old Friend drank whiskey earlier.
- The Chef had been told their services would end after tonight.
- The Business Partner and Sister both had genuine financial/family disputes.
- The rear route exists and can connect the library to the kitchen side.

Do not reveal the service-log gap, hidden household charges, or berry-reduction rinse trace until the branch is locked.

## Four-player clue chain

1. **Death window** — library, 10:31–10:35.
2. **Service gap** — kitchen timer / smart-speaker activity pauses during the fatal window despite the Chef's continuous-cleanup claim.
3. **Rinsed prep trace** — sink residue and a freshly rinsed prep cloth contain a distinctive berry reduction served only with Adrian's private plate.
4. **Household charges** — receipts show personal purchases hidden inside household food accounts, and Adrian marked them for a confrontation after dinner.

## Correct support paths

- `chef_service_gap`
- `kitchen_access_link`
- `glass_origin_link`
- `back_door_timing`

The generic voice draft is not a correct support link because it never names the Chef, staff, or household accounts. Conviction target remains 12 points with correct culprit required, 8/12 minimum, and at least two correct support links.

## Red herrings that stay truthful

- Old Friend's whiskey glass and old debt
- Business Partner's missing-money dispute
- Sister's inheritance fight
- optional legal/property conflicts

## Critical logic rule

The whiskey clue must remain truthful but cannot be treated as the Chef's murder trace. Variant D uses a separate kitchen-service residue so returning players cannot simply equate 'rinsed whiskey glass' with the culprit.

## Release gate

Automated/code audit now passes for:
- variant-aware Chef private story and answer prompts
- service-gap / rinse-trace / household-charge evidence chain
- evidence-gated household-account reveal timing
- at least two encounterable correct support links for every innocent core seat
- branch-safe pre-lock facts
- generic voice draft excluded from scored proof
- 4–8 player fairness simulation
- production build gate

**Still required before `releaseReady = true`:** a successful real multi-device live playtest covering SEALED + LISTEN, the full investigation/evidence sequence, Build Your Case submissions, reveal, and Start Over.
