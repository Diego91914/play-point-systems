# Live Craps — Product & Rules Foundation

**Status:** concept / architecture-ready

## Product promise

**Real dice. Digital table.**

Live Craps is a Play Amplified social craps table where every player joins one private room from their own phone. A table may use either **Physical Dice** or **Virtual Dice**. Play Amplified handles the point, shooter rotation, legal bets, payouts, chip accounting, explanations, roll history, table reactions, and game state.

Physical Dice preserves the original real-world social experience. Virtual Dice provides a cinematic digital roll without changing the betting engine or rules.

## Standard table configuration — LOCKED

The default Live Craps experience is a **$10 Standard Table**, expressed entirely in fictional game chips.

- Table minimum: 10 chips.
- Starting rack: 1,000 fictional chips per player.
- Standard between-roll betting/action clock: 15 seconds.
- Beginner assistance: ON by default.
- Dice mode: host chooses **Physical Dice** or **Virtual Dice** when creating the table.
- The 10-chip table minimum does not mean every individual wager must be exactly 10 chips. The virtual dealer understands legal and payout-friendly units for each wager (for example, Place 6/8 sizing) and guides or adjusts the player's requested action accordingly.
- The table is the brain: players choose intent; the server handles legal amounts, payout units, press funding, and dealer bookkeeping.
- Future optional presets may provide different fictional-chip pacing, but $10 Standard is the canonical default.

No table setting represents real-money wagering. Chips cannot be purchased during a session, cashed out, transferred for value, or settled through Play Amplified.

## Dice modes — LOCKED

### Physical Dice

- The shooter physically rolls two ordinary dice.
- The shooter enters both individual die faces on their phone.
- The physical dice are the real-world source of truth; the server remains authoritative for digital state.
- Both die faces must be retained because exact composition matters for hardways and other bets.

### Virtual Dice

- The server generates and permanently records both die faces before any reveal animation starts.
- The animation is a presentation of an already-authoritative result; animation/physics never determines the wager result.
- The current shooter receives the full cinematic roll experience.
- Other players receive a synchronized table-view reveal of the same authoritative roll.
- The roll should feel physical: release, tumble, contact/bounce, settle, then reveal.
- Once generated for a roll ID, the result is immutable and repeated taps/reconnects must reveal the same result rather than generate another roll.
- Settlement cannot occur until the authoritative virtual roll exists, and it may occur only once.
- The existing excitement engine may trigger personalized haptics/celebrations after the roll settles according to what the result meant to each player.

### Mode switching

A table must never be ambiguous about which dice source owns the next roll.

- The host may choose the mode at table creation.
- A mode change is permitted only between shooter hands when the point is OFF, no roll is pending, and no betting window has locked for the next roll.
- A mode cannot change during a shooter's active point cycle.
- Every roll history entry records whether its source was `physical` or `virtual`.

## Core table loop

1. Host creates a private Live Craps room and selects dice mode.
2. Players join from their own phones.
3. Everyone receives the configured fictional starting stack.
4. The app identifies the current shooter.
5. Players place legal bets on their own phones.
6. Betting/actions lock at DICE OUT.
7. Roll according to table mode:
   - Physical: shooter rolls two real dice and enters both faces.
   - Virtual: server commits both faces and clients cinematically reveal them.
8. Play Amplified settles the authoritative roll exactly once.
9. The table shows public payouts and each player's personal dealer actions.
10. The 15-second default betting/action countdown begins immediately while Collect / Same Bet / Press / Move and other legal actions are available.
11. At zero, DICE OUT locks the next roll.
12. The shooter continues until a seven-out, then the app tells the table who receives the dice next.

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

## Roll trust model

The server remains authoritative for all digital state.

- Only the current shooter may initiate/submit the roll action.
- Each die must be an integer from 1 through 6.
- Physical rolls use a pending confirmation/correction state before settlement.
- Virtual rolls are server-generated, bound to a unique roll ID, immutable, and replay-safe.
- Once settled, a roll becomes immutable history except through an explicit host/admin recovery flow that is not part of normal play.
- Duplicate initiate/submit/confirm/settle taps must be rejected safely or resolve idempotently.

## Betting direction

The first playable build should start small and trustworthy, but the production engine is intended to grow into a complete craps table rather than a permanently simplified ruleset.

### Core bets
- Pass Line
- Don't Pass
- Come
- Don't Come
- Pass/Come Odds
- Don't Pass/Don't Come Lay Odds
- Field
- Place 4 / 5 / 6 / 8 / 9 / 10

### Expanded table
- Buy bets
- Lay bets
- Hardways
- Any 7
- Any Craps
- individual 2 / 3 / 11 / 12 propositions
- Horn / Horn High
- C&E
- World / Whirl where supported
- Hop bets
- Small / Tall / All bonus bets
- common combination bets such as Inside / Across as dealer shortcuts

The complete offered-bet list and each payout must be verified against authoritative craps rules before release. Beginner mode may hide complexity, but it must not force the underlying table engine to be incomplete.

The engine should represent bets as server-owned contracts with a stake, owner, lifecycle, legal placement window, settlement rule, and payout. Clients never calculate final payouts independently.

## Fictional chips only

Live Craps is a social game using fictional game chips. Play Amplified does not sell, cash out, transfer, or settle real money through the game. There is no real-money wagering or casino payout system.

## Beginner experience

Craps is intimidating to new players, so the app should explain the table progressively.

- Default beginner view highlights a few understandable bets.
- Tapping a bet explains what has to happen for it to win or lose.
- Illegal bets should not be selectable.
- The virtual dealer proactively offers context such as adding odds behind a Pass/Come bet when legal.
- Advanced players may switch to a full table view.
- After every roll, each player should see exactly what happened to their own bets and why.

## Physical-table UI

The visual center of the game should be the point and shooter, not a fake animated casino.

Examples:

`CHANNING IS THE SHOOTER — POINT IS 6`

`BETS LOCKED — ROLL THE DICE`

`4 + 3 = 7 — SEVEN OUT`

`PASS THE DICE TO GARY`

In Physical mode, the shooter roll-entry screen should use six large die faces for Die 1 and six for Die 2. The combined total should appear immediately before confirmation.

In Virtual mode, the shooter sees the cinematic roll while every device ultimately reveals the identical server-authoritative dice result.

## Engine phases

### Phase 1 — roll foundation
- room/table state
- player seats and shooter rotation
- point lifecycle
- physical two-die entry
- virtual server-authoritative dice generation
- pending-roll correction/settlement
- immutable roll history with roll source
- reconnect-safe state

### Phase 2 — betting foundation
- fictional chip ledger
- Pass / Don't Pass
- Come / Don't Come
- Odds / Lay Odds
- Field
- Place bets
- server-authoritative settlement
- legal betting windows

### Phase 3 — expanded table
- Buy / Lay
- Hardways
- proposition and Hop bets
- Small / Tall / All
- beginner/full table modes

### Phase 4 — polish
- cinematic virtual dice
- synchronized reveal
- personalized haptics/excitement
- QR join
- mobile certification
- stale/duplicate action protection
- host recovery tools
- roll-history presentation
- table stats and end-of-night summary

## Release gate

Live Craps must not be marked live or purchasable until both offered dice modes, shooter rotation, point transitions, chip conservation, payout rules, reconnects, duplicate-action handling, mode switching protections, and every offered bet pass automated and multi-device certification.
