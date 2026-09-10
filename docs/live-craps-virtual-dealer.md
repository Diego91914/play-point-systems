# Live Craps — Virtual Dealer Contract

Status: LOCKED production direction

## Core principle

**The table is the brain.**

Play Amplified must behave like the dealer/crew, not merely draw a digital craps felt. The server understands each wager, what the roll did to it, what remains working, what came down, what was paid, what money is available to move, and which follow-up actions are legal for each player.

## Post-roll sequence

Immediately after the shooter confirms the physical dice:

1. Settle the authoritative roll once.
2. Show the common roll and public table payouts so everyone can see who was paid, like standing at a physical craps table.
3. Start the next betting/action countdown immediately. Default: 15 seconds; table options: 10 / 15 / 20 seconds.
4. During that same countdown, present each player only the dealer actions relevant to their own wagers.
5. At zero call DICE OUT and lock all betting/actions. There is no second countdown.
6. Shooter physically rolls and enters both die faces.

## Dealer actions

The engine derives legal actions from wager state. Examples include:

- COLLECT
- SAME BET
- PRESS
- PRESS 1 UNIT
- PRESS HALF where legal/meaningful
- DOUBLE
- PRESS ALL when multiple eligible wagers exist
- CUSTOM legal amount
- TAKE DOWN
- MOVE TO another legal number/bet
- INSIDE / ACROSS where legal

The UI must never require the player to remember dealer bookkeeping that the server already knows.

### Pressing

PRESS must identify the wager being pressed. If several wagers are eligible, ask which number/wager, e.g. `6 — $30`, `8 — $30`, `Inside — $44`, or `PRESS ALL`. Recommended press amounts should respect payout-friendly betting units.

A press is an instruction to the virtual dealer, not a manual chip calculation. The dealer uses the player's payout/returned chips first. If the legal target press requires more chips than the current payout provides, the engine automatically takes the exact additional amount from that player's fictional bankroll/chip rack when sufficient funds are available.

Example: a player has $14 available from the roll and selects a legal press that requires $18. The dealer applies the $14 and automatically takes the remaining $4 from that player's bankroll. The player does not calculate or manually transfer the difference.

If the bankroll cannot cover the required difference, the engine must not create an invalid or partially funded wager. It should offer the largest legal affordable press and/or alternatives such as SAME BET or COLLECT.

No real-money language or settlement is used. The source of supplemental chips is the player's in-game bankroll/chip rack.

### Money that comes down

When a wager or returned amount becomes available for player direction, do not silently force the player to rebuild the bet. The virtual dealer should state the available amount and offer only legal destinations for the current table state, including Collect when appropriate.

Example: `Your bet came down — $36 available. Where do you want it?`

## Public vs personal information

The common post-roll view may show player name/seat and what each player was paid on that roll. Each player's detailed wager controls, bankroll, and dealer choices remain personal to that player's device.

Public payout reporting must be derived from wager-level settlement events, not inferred only from net bankroll change. A player may win one wager, lose another, and leave another working on the same roll.

## Authority

All legal action generation and wager movement is server-authoritative. Clients display choices and submit intent. Clients do not calculate payouts, invent legal destinations, determine wager ownership from chip graphics, or settle rolls.
