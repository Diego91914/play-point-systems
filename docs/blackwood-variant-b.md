# Blackwood House — Variant B: The Missing Money

Status: **code-audited / not selectable in live games / live playtest pending**

## Core truth

**Culprit:** The Business Partner  
**Motive:** Adrian discovered that the Business Partner had been quietly diverting Blackwood Holdings money and planned to expose it.  
**Fatal location:** Library  
**Fatal window:** 10:31–10:35 p.m.  
**Aftermath:** After an earlier public argument, the Business Partner returns to the library for a second private confrontation. The confrontation becomes fatal. The Partner leaves by the rear route and returns toward the study.

## Branch path

**SEALED letter + LEAVE voice draft** → Variant B once release-ready.

The branch decisions are ordinary private story choices. Players never see the hidden matrix. A sealed/unheard artifact can shape branch selection, but content the investigators never encountered is never credited as proof.

## Four-player clue chain

1. **Death window** — library, 10:31–10:35.
2. **Torn bank-record fragment** — a damp corner from copied Blackwood Holdings records is found near the kitchen/back-door route and matches copies handled in the study.
3. **Rear route** — dark-clothed movement and a damp dress-shoe impression establish movement from the library side toward the kitchen entrance near 10:35.
4. **Company records** — forensic review establishes deliberate diversion; the copied study packet is missing the matching corner and Adrian planned a private confrontation.

## Correct support paths

- `partner_study_gap`
- `partner_records_link`
- `partner_back_route`
- `partner_cleanup_trace`

All four are minimum-player safe. `partner_back_route` depends only on the Partner's unverified continuous-study claim and the 10:35 rear-route evidence; it does not depend on an optional-role hallway sighting.

## Truthful red herrings

- Old Friend's old debt / blue ledger / whiskey
- Sister's inheritance conflict
- Chef's firing
- optional legal/property secrets

## Release gate

Automated/code audit now passes for:
- variant-aware character memory and answer prompts
- branch-specific evidence cards
- private/personal discovery rules
- Case File support facts
- scoring and variant reveal data
- branch-safe pre-lock evidence
- encounterable support facts only
- minimum 4-player solvability and 4–8 fairness simulation
- production build gate

**Still required before `releaseReady = true`:** a successful real multi-device live playtest covering SEALED + LEAVE, the full investigation/evidence sequence, Build Your Case submissions, reveal, and Start Over.
