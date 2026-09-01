# Blackwood House — Variant B: The Missing Money

Status: **development / not selectable in live games**

This variant exists to prove that the same Blackwood House cast and setting can support a different culprit without random relabeling. It may not be enabled until the interrogation engine, private discoveries, evidence cards, final scoring, and four-player solvability tests all use this authored truth consistently.

## Core truth

**Culprit:** The Business Partner  
**Motive:** Adrian discovered that the Business Partner had been quietly diverting Blackwood Holdings money and planned to expose the theft the next morning.  
**Fatal location:** Library  
**Fatal window:** 10:31–10:35 p.m.  
**Method / aftermath:** After an earlier public argument, the Business Partner returns to the library for a second private confrontation. The argument turns fatal. The Partner leaves by the rear route, crosses the porch in a dark outer layer, enters near the kitchen, and attempts to remove a trace tying them to the private meeting before returning toward the study.

## Branch relationship

The sealed-letter decision is allowed to contribute to variant selection, but the player must never know that it does.

Current intended branch pressure:
- **OPEN THE LETTER** strongly favors Variant A / The Old Debt.
- **KEEP IT SEALED** can favor Variant B / The Missing Money once Variant B is release-ready.

The letter itself does not magically change the past. Before the variant locks, only branch-safe facts may be shown. Once the variant locks, all later clues must follow that authored truth.

## Branch-safe facts shared with Variant A

These facts can remain true before either culprit is locked:
- Adrian Blackwood is found dead in the library.
- The fatal event occurred between 10:31 and 10:35.
- Adrian had serious unresolved financial concerns.
- The Business Partner and Adrian argued earlier in the evening.
- Adrian had also become tense about an older personal matter.
- Adrian drank red wine; the whiskey glass does not belong to him.
- A dark-clothed figure used or approached the back-porch route near the critical window.
- Several innocent players have genuine secrets and motives to lie.

No pre-lock evidence may state that the old theft definitely caused the murder or that the current company dispute definitely caused it.

## Four-player roles

### Business Partner — culprit
Public relationship remains the same: co-builder of Blackwood Holdings, visibly under strain with Adrian.

Private truth in Variant B:
- The missing company money is not merely an accounting disagreement. You diverted funds and falsified records.
- Adrian confronted you publicly around 10:20, but did not reveal what he had discovered.
- You went to the study after the argument and realized Adrian had copied records that could expose you.
- Around 10:31 you returned to the library to stop him from going to the authorities.
- The confrontation became fatal during the 10:31–10:35 window.
- You left by the rear route and crossed the porch in a dark outer layer.
- Your cover story is that you stayed in the study reviewing records after 10:25.
- Your deleted text to the forensic accountant remains real, but in this variant it is part of your effort to create a believable audit narrative around the missing money.
- Your objective is to keep the room focused on the old personal ledger, the inheritance fight, or another suspect.

### Old Friend — innocent alternate suspect
- Decades ago, you really did have an ugly financial dispute with Adrian.
- You believed it had been resolved, although Adrian recently raised it again.
- You drank whiskey earlier in the evening.
- You were near the downstairs bathroom during the critical window.
- Your old dispute makes the blue ledger look devastating, but in this variant it is a truthful red herring rather than the murder motive.
- You did not kill Adrian.

### Younger Sister — core witness
- The inheritance fight remains real.
- You are outside during the critical period.
- Around 10:35 you see a dark-clothed figure move across the rear route toward the kitchen side.
- You cannot identify the face.
- You possess Adrian’s sealed envelope.
- If you keep it sealed, you genuinely do not know what it says.
- If Variant B is active, later evidence must not contradict whatever text the opened-letter branch actually revealed; therefore Variant B should only become eligible from branch combinations that remain compatible with its letter content.

### Private Chef — core physical-evidence witness
- Adrian drank red wine and disliked whiskey.
- You are in the kitchen during most of the critical period.
- You notice evidence of someone passing through the kitchen/rear route shortly after the murder.
- Variant B must use an authored trace tied to the Business Partner rather than falsely treating the Old Friend’s whiskey as proof.
- Candidate trace for final implementation: a copied-record binder clip / blue transfer ink / torn bank-record corner found damp near the sink or back door.

## Evidence progression

The exact wording must stay branch-safe until the case truth locks.

### Evidence 1 — Time of death
Public:
- death in library, 10:31–10:35
- earlier arguments and movements become relevant

Private possibilities:
- Partner knows their first argument ended before the fatal window, but hides the second meeting
- Sister knows the porch sighting occurs near the end of the window
- Chef knows they were in the kitchen for most of it

### Evidence 2 — Rear-route trace
Variant B replaces the Old Friend-specific whiskey-cleanup inference with a trace tied to the Partner’s records.

Recommended authored clue:
- A damp fragment from a copied Blackwood Holdings bank packet is found near the kitchen/back-door route.
- The fragment matches copies the Business Partner had been handling in the study.
- This proves movement, not murder by itself.

The whiskey glass can still exist as a truthful red herring connected to the Old Friend.

### Evidence 3 — Porch route
Public:
- damp dress-shoe impression / rear-route movement
- dark-clothed figure near 10:35

Private:
- Sister can connect direction of travel
- Chef can connect the timing of the disturbed back door
- Partner must defend why copied records or their clothing may connect to that route

### Evidence 4 — Company records
Public:
- forensic review shows the missing money was deliberately diverted, not merely misbooked
- a copied packet in the study is missing a page or fragment matching the rear-route trace
- Adrian had prepared a note indicating he intended to force a private admission that night

The old blue ledger remains truthful but resolves as a separate historical dispute, preventing returning players from treating it as automatic proof.

## Private discovery targets

At least four correct support links should exist:
1. **second_meeting_break** — questioning the Partner about timeline / opportunity exposes a gap after the first argument.
2. **record_fragment_route** — copied-record evidence connects the Partner’s study materials to the rear route.
3. **porch_partner_link** — clothing/timing/route questioning connects the Partner to the 10:35 movement.
4. **current_money_motive** — financial questioning distinguishes the active company theft from the Old Friend’s older dispute.

Truthful red herrings:
- Old Friend’s old debt / blue ledger
- Sister’s inheritance conflict
- Chef’s firing
- optional-role legal/property secrets

## Conviction key

Target remains 12 points:
- correct culprit: 4
- correct motive `business_money`: 2
- library: 1
- 10:31–10:35: 1
- up to four correct Variant B support links: 4

Conviction remains:
- correct culprit required
- 8/12 minimum
- at least two correct supporting links

## Four-player solvability proof requirement

Before enabling Variant B, verify that with only Partner, Old Friend, Sister, and Chef present:
- no optional role holds required evidence
- at least two correct support links are realistically obtainable by every innocent seat through private clues and/or their available investigation turns
- the Partner has a coherent false story and enough truthful alternate suspicion to defend themselves
- the Old Friend’s ledger/whiskey evidence is suspicious but ultimately explainable
- the Sister’s branch decision cannot expose implementation mechanics
- the Chef’s physical clue does not uniquely identify the culprit without investigation
- the final case can be proven without the sealed letter being opened

## Release gate

Do not set `blackwood-business-partner.releaseReady = true` until all of the following are implemented:
1. variant-aware character memory and answer prompts
2. variant-aware evidence cards
3. variant-aware private discoveries
4. variant-aware Case File support facts
5. variant-aware scoring and reveal
6. branch-safe pre-lock evidence audit
7. 4/5/6/7/8-player fairness audit
8. successful production build and playtest
