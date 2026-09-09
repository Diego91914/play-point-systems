# Play Amplified Live Craps — Betting UX Contract

Status: LOCKED production direction

## Core interaction
The player chooses only two things: **how much** and **where**. Play Amplified handles ownership, seat-relative chip placement, legal bet interpretation, payout units, settlement, and display.

1. Select a chip denomination/amount first.
2. Touch a legal betting zone on the felt.
3. The system creates or increases that player's wager in that zone.
4. The visual chip marker is rendered in the betting zone at the anchor assigned to that player's table seat.
5. Show immediate lightweight feedback and an Undo affordance; do not require a confirmation modal for ordinary bets.

## Touch targets
Visible casino-felt artwork is not the hitbox. Each betting zone must have a generous mobile touch target. Small printed labels must never require precision tapping. Overlapping zones must resolve deterministically to one legal wager.

## Seat-aware placement
Each player has a stable table seat. Every betting zone defines seat anchors. Multiple players betting the same location are rendered at their own anchors rather than as an ambiguous shared pile. The server owns the wager identity; visual position never determines ownership.

## Adding to bets
Touching a location where the player already has a wager adds the selected amount to that wager. It does not create visually indistinguishable duplicate wagers.

## Persistent betting controls
Keep chip denominations plus **UNDO**, **CLEAR NEW BETS**, and **REPEAT LAST** immediately accessible while betting is open.

- Undo reverses the most recent unsettled betting action.
- Clear New Bets removes only changes made in the current open betting window; it must not silently remove previously working bets.
- Repeat Last recreates the player's eligible prior-roll wager pattern subject to bankroll and current-roll legality.

## Combination bets
A combination is one touch but expands server-side into its component wagers using valid payout units. Examples include Inside, Across, Horn, C&E, and Small/Tall/All combinations. The UI previews the distribution before/while placing when needed, but routine placement remains fast.

## Payout-friendly units
The UI should recommend or automatically construct denominations that settle cleanly in whole fictional chips. The engine remains authoritative and rejects unsupported/illegal amounts rather than creating hidden fractional chips.

## Roll lock
Betting closes before physical dice entry can settle a roll. Once locked, no player may alter wagers for that roll. Dice correction corrects only the entered dice before settlement; it does not reopen betting.

## After a roll
Each phone receives a personalized result: affected wagers, wins, losses, net change for the roll, bankroll, and wagers that remain working. Shared roll facts (dice, total, point, shooter, ATS progress) are public table state; player wager/result detail is personalized.

For eligible winning working bets, offer contextual actions such as **COLLECT**, **SAME BET**, and **PRESS** without forcing them on beginners.

## Modes
Beginner mode may hide advanced areas and explain a touched bet, but it uses the same underlying table and settlement rules. Experienced mode exposes the full betting surface.

## Non-negotiable principle
**Amount first → touch location → Play Amplified places it correctly for that player and seat.**
