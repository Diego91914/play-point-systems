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
- The 10-chip table minimum does not mean every individual wager must be exactly 10 chips. The virtual dealer understands legal and payout-friendly units for each wager and guides or adjusts the player's requested action accordingly.
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
- Once generated for a roll ID, the result is immutable and repeated taps/reconnects reveal the same result.
- Settlement may occur only once.

### Mode switching
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
7. Roll according to table mode.
8. Play Amplified settles the authoritative roll exactly once.
9. The table shows public payouts and each player's personal dealer actions.
10. The 15-second default betting/action countdown begins immediately.
11. At zero, DICE OUT locks the next roll.
12. The shooter continues until a seven-out, then the app tells the table who receives the dice next.

## Shooter and point lifecycle

- Come-out roll: 7 or 11 is a natural; 2, 3, or 12 is craps; 4, 5, 6, 8, 9, or 10 establishes the point.
- With a point on: making the point turns it off and the same shooter continues; 7 is a seven-out and rotates the shooter; other totals leave the point unchanged.
- Shooter order must remain deterministic through refresh/reconnect.

## Roll trust model

- Only the current shooter may initiate/submit the roll action.
- Each die must be an integer from 1 through 6.
- Physical rolls use a pending confirmation/correction state before settlement.
- Virtual rolls are server-generated, bound to a unique roll ID, immutable, and replay-safe.
- Duplicate initiate/submit/confirm/settle taps must be rejected safely or resolve idempotently.

## Betting scope — STANDARD TABLE FIRST

Live Craps should feel like walking up to a familiar mainstream casino craps table. **Completeness does not mean enabling every wager that exists somewhere.** Optional, regional, legacy, electronic-table, or casino-specific wagers should not be squeezed into the launch layout merely because an engine can support them.

### Standard launch table
- Pass Line
- Don't Pass
- Come
- Don't Come
- Pass/Come Odds
- Don't Pass/Don't Come Lay Odds
- Field
- Place 4 / 5 / 6 / 8 / 9 / 10
- Buy 4 / 10, with broader Buy support available only where the table rules call for it
- Lay 4 / 5 / 6 / 8 / 9 / 10
- Hardways 4 / 6 / 8 / 10
- Any 7
- Any Craps
- individual 2 / 3 / 11 / 12 propositions
- Horn
- C&E
- common Hop bets through an advanced/center-bet surface rather than crowding the beginner layout
- Small / Tall / All when the selected table layout includes ATS
- Inside / Across as virtual-dealer shortcuts that expand into ordinary Place bets, not separate wager mathematics

### Not part of the standard launch layout
These may remain engine experiments or future table variants, but they are **not** required for launch and should not occupy standard-table UI:
- Big 6 / Big 8
- Put bets
- Over 7 / Under 7
- Six-Seven-Eight
- Horn High
- World / Whirl
- uncommon or casino-specific proposition combinations
- any wager added solely because a jurisdiction permits it

A future named table variant may deliberately enable an optional wager set, but the canonical `$10 Standard Table` stays focused and recognizable.

### Working / off behavior
The engine must preserve normal craps working/off behavior rather than simplify it away. On a come-out roll, Come odds, Place bets, and Buy bets are OFF by default unless the player explicitly calls them working. Don't Come odds and Lay bets remain ON. Hardway come-out behavior is table-dependent, so the standard Play Amplified table must choose and display one explicit rule rather than silently changing by venue convention.

The offered-bet list and each payout must be verified against authoritative craps rules before release. Beginner mode may hide complexity without changing the underlying settlement rules for bets actually offered.

Bets are server-owned contracts with a stake, owner, lifecycle, legal placement window, settlement rule, and payout. Clients never calculate final payouts independently.

## Fictional chips only

Live Craps is a social game using fictional game chips. Play Amplified does not sell, cash out, transfer, or settle real money through the game.

## Beginner experience

- Default beginner view highlights understandable bets.
- Tapping a bet explains what has to happen for it to win or lose.
- Illegal bets are not selectable.
- The virtual dealer proactively offers context such as adding odds behind a Pass/Come bet when legal.
- Advanced players may switch to the standard full-table view.
- After every roll, each player sees exactly what happened to their own bets and why.

## Physical-table UI

The visual center of the game should be the point and shooter, not a fake animated casino.

Examples:

`CHANNING IS THE SHOOTER — POINT IS 6`

`BETS LOCKED — ROLL THE DICE`

`4 + 3 = 7 — SEVEN OUT`

`PASS THE DICE TO GARY`

In Physical mode, the shooter roll-entry screen uses six large die faces for Die 1 and six for Die 2. In Virtual mode, every device ultimately reveals the identical server-authoritative dice result.

## Engine phases

### Phase 1 — roll foundation
room/table state; player seats/shooter rotation; point lifecycle; physical two-die entry; virtual server-authoritative generation; immutable history; reconnect-safe state.

### Phase 2 — betting foundation
fictional chip ledger; Pass/Don't Pass; Come/Don't Come; Odds/Lay Odds; Field; Place; server-authoritative settlement; legal betting windows.

### Phase 3 — standard full table
Buy/Lay; Hardways; standard propositions; Horn/C&E; optional ATS table feature; working/off controls; beginner/full-table modes. Exotic wager variants are not a launch requirement.

### Phase 4 — polish
cinematic virtual dice; synchronized reveal; personalized haptics/excitement; QR join; mobile certification; stale/duplicate action protection; host recovery; history/stats/end-of-night summary.

## Release gate

Live Craps must not be marked live or purchasable until both offered dice modes, shooter rotation, point transitions, chip conservation, payout rules, reconnects, duplicate-action handling, mode switching protections, working/off behavior, and every wager actually exposed on the standard table pass automated and multi-device certification.
