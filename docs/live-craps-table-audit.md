# LIVE CRAPS — Standard Table Wager Audit

This audit separates the core launch table from optional/variant wagers. Rules and paytables must remain explicit server configuration; client layout text is never authoritative.

## Core standard table

- Pass Line / Don't Pass
- Come / Don't Come
- Pass/Come taking odds; Don't Pass/Don't Come laying odds
- Place 4/5/6/8/9/10
- Buy 4/5/6/8/9/10
- Lay 4/5/6/8/9/10
- Field
- Hard 4/6/8/10
- Any 7
- Any Craps
- Craps 2 / Craps 3 / Eleven / Craps 12
- Horn
- Horn High 2 / 3 / 11 / 12
- C&E
- World / Whirl
- Hop exact combinations
- Small / Tall / All bonus

## Supported table extensions

These are legitimate craps wagers but need not clutter Beginner mode:

- Big 6 / Big 8 — even-money multi-roll wager; chosen 6/8 must arrive before 7.
- Put bet — direct flat wager on 4/5/6/8/9/10 paying even money, with true odds available.
- Over 7 / Under 7 — one-roll even-money wagers where 7 loses both sides.
- Six-Seven-Eight — jurisdiction/table variant; keep out of launch core unless deliberately enabled.

## Combination expansion

Combination labels are server-side macros, not independent payout math:

- Horn = equal units on 2, 3, 11, 12.
- Horn High = five units: one on each Horn number plus one extra unit on the selected high number.
- C&E = equal units on Any Craps and Eleven.
- World / Whirl = equal units on 2, 3, 7, 11, 12.
- Inside = Place 5, 6, 8, 9 in legal payout-friendly units.
- Across = Place 4, 5, 6, 8, 9, 10 in legal payout-friendly units.

## Working / off behavior that must be modeled

The engine must not reduce this to a single global switch.

- Flat Pass/Don't Pass always follow their own contract rules.
- Come/Don't Come flat wagers that have traveled remain their own contracts.
- Odds behind Come/Don't Come need an explicit working/off state on a new come-out roll; default UI should follow normal table convention and clearly show OFF when applicable.
- Place, Buy, Lay, Hardways and other multi-roll wagers require explicit working state rather than assumptions hidden in UI.
- One-roll propositions resolve on the immediately following valid roll and never become working multi-roll bets.
- ATS has its own shooter-cycle state and loses on any 7, including a come-out 7.

## Launch presentation

Beginner mode should expose Pass, Don't Pass, Field, Place numbers and contextual Odds first. Advanced mode exposes the complete enabled table. Hiding a wager in Beginner mode must never change settlement rules.

## Remaining engine gaps after audit

1. Horn High expansion and receipts.
2. Big 6 / Big 8.
3. Put bets and their attached odds relationship.
4. Over 7 / Under 7 if enabled for the launch table.
5. Per-wager working/off controls, especially Come/Don't Come odds on come-out.
6. Unified settlement integration for all newer wager modules.
7. Full-table idempotency and duplicate-settlement protection.
8. Table paytable configuration so variant Field, vig, bonus and proposition schedules cannot silently drift.

## Product rule

LIVE CRAPS uses fictional chips only. There is no chip purchase, cash-out, real-money settlement, or payment facilitation.