# Live Craps — Product & Rules Foundation

**Status:** concept / architecture-ready

## Product promise

**Real dice. Digital table.**

Live Craps is a Play Amplified social table game built around physical dice. Players sit together, join one private room from their own phones, place fictional-chip bets digitally, and physically roll two ordinary dice on the table. Play Amplified handles the point, shooter rotation, legal bets, payouts, chip accounting, explanations, roll history, and game state.

The phones should remove the bookkeeping without replacing the physical moment of rolling dice together.

## Standard table configuration — LOCKED

The default Live Craps experience is a **$10 Standard Table**, expressed entirely in fictional game chips.

- Table minimum: 10 chips.
- Starting rack: 1,000 fictional chips per player.
- Standard between-roll betting/action clock: 15 seconds.
- Beginner assistance: ON by default.
- The 10-chip table minimum does not mean every individual wager must be exactly 10 chips. The virtual dealer understands legal and payout-friendly units for each wager (for example, Place 6/8 sizing) and guides or adjusts the player's requested action accordingly.
- The table is the brain: players choose intent; the server handles legal amounts, payout units, press funding, and dealer bookkeeping.
- Future optional presets may provide different fictional-chip pacing, but $10 Standard is the canonical default.

No table setting represents real-money wagering. Chips cannot be purchased during a session, cashed out, transferred for value, or settled through Play Amplified.

## Core table loop

1. Host creates a private Live Craps room.
2. Players join from their own phones.
3. Everyone receives the configured fictional starting stack.
4. The app identifies the current shooter.
5. Players place legal bets on their own phones.
6. Betting locks.
7. The shooter physically rolls two real dice.
8. The shooter enters the two individual die faces into the app.
9. The table briefly confirms/corrects the roll before settlement.
10. Play Amplified settles all bets, updates the point, and tells the table what happens next.
11. The shooter continues until a seven-out, then the app tells the table who receives the dice next.

## Why enter both dice

The app must record each die separately, not only the total. A roll of 4 + 4 and a roll of 3 + 5 both total 8, but Craps treats those combinations differently for hardway bets. The input should still be fast: two large die-face taps, then a short confirmation window.

## Shooter and point lifecycle

- Come-out roll:
  - 7 or 11: natural; point remains off.
  - 2, 3, or 12: craps; point remains off.
  - 4, 5, 6, 8, 9, or 10: that number becomes the point.
- With a point on:
  - Rolling the point makes the point; point returns off and the same shooter begins another come-out roll.
  - Rolling 7 is a seven-out; the point returns off and the dice pass to the next active player.
  - Other totals leave the point unchanged and the shooter continues.

Shooter order must remain deterministic through refresh/reconnect.

## Roll entry and trust model

The physical dice are the source of truth, but the server remains authoritative for digital state.

- Only the current shooter may submit a roll.
- Each die must be an integer from 1 through 6.
- A submitted physical roll becomes `pending` before settlement.
- The UI should provide a short correction/confirmation window so a mistap can be fixed before chips move.
- Once settled, the roll becomes immutable history except through an explicit host/admin recovery flow that is not part of normal play.
- Duplicate submit/settle taps must be rejected safely.

## Betting direction

The first playable build should start small and trustworthy rather than attempt the entire casino layout at once.

### Phase 1 bets
- Pass Line
- Don't Pass
- Field
- Place 4 / 5 / 6 / 8 / 9 / 10

### Phase 2 bets
- Come / Don't Come
- Odds
- Hardways
- Any 7 / Any Craps
- Horn-style proposition bets

The engine should represent bets as server-owned contracts with a stake, owner, lifecycle, legal placement window, settlement rule, and payout. Clients never calculate final payouts independently.

## Fictional chips only

Live Craps is a social game using fictional game chips. Play Amplified does not sell, cash out, transfer, or settle real money through the game. There is no real-money wagering or casino payout system.

## Beginner experience

Craps is intimidating to new players, so the app should explain the table progressively.

- Default beginner view highlights a few understandable bets.
- Tapping a bet explains what has to happen for it to win or lose.
- Illegal bets should not be selectable.
- Advanced players may switch to a full table view.
- After every roll, each player should see exactly what happened to their own bets and why.

## Physical-table UI

The visual center of the game should be the point and shooter, not a fake animated casino.

Examples:

`CHANNING IS THE SHOOTER — POINT IS 6`

`BETS LOCKED — ROLL THE DICE`

`4 + 3 = 7 — SEVEN OUT`

`PASS THE DICE TO GARY`

The shooter roll-entry screen should use six large die faces for Die 1 and six for Die 2. The combined total should appear immediately before confirmation.

## Engine phases

### Phase 1 — physical-roll foundation
- room/table state
- player seats and shooter rotation
- point lifecycle
- physical two-die entry
- pending-roll correction/settlement
- immutable roll history
- reconnect-safe state

### Phase 2 — betting foundation
- fictional chip ledger
- Pass / Don't Pass
- Field
- Place bets
- server-authoritative settlement
- legal betting windows

### Phase 3 — expanded table
- Come / Don't Come
- Odds
- Hardways
- proposition bets
- beginner/full table modes

### Phase 4 — polish
- QR join
- mobile certification
- stale/duplicate action protection
- host recovery tools
- roll-history presentation
- table stats and end-of-night summary

## Release gate

Live Craps must not be marked live or purchasable until physical-roll entry, shooter rotation, point transitions, chip conservation, payout rules, reconnects, duplicate-action handling, and every offered bet pass automated and multi-device certification.
