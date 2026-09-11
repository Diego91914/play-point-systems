# Dealer's Choice — Product & Rules Foundation

**Status:** concept / architecture-ready

## Product promise

**Your deal. Your game. Your rules.**

Dealer's Choice is a fully online private card night for friends who may no longer live in the same place. The dealer rotates around the table. When the deal reaches a player, that player calls one game from the room's enabled library. Play Amplified owns the authoritative deck, private cards, betting state, chips, pots, legal actions, settlement, and dealer rotation.

The emotional promise is simple: **get the old poker table back together, wherever everybody ended up.**

Dealer's Choice is its own Play Amplified game. It is not a Card Shark mode and should not depend on physical cards.

## Core session loop

1. Host creates a private room and chooses session rules.
2. Friends join remotely from their own devices.
3. Every player receives the same starting chip stack.
4. The dealer button rotates clockwise.
5. Current dealer chooses a game from the enabled library.
6. That called game runs to its natural endpoint.
7. Chips settle into the persistent session bankrolls.
8. Dealer rotates and the next player calls a game.
9. Session ends according to the selected session format.
10. Final standings emphasize net performance, not raw stack alone.

**Important engine rule:** a dealer turn is one complete called game, not necessarily one hand.

## Initial game library target

The engine should be composable rather than ten unrelated hard-coded games. Initial target library:

- Five-Card Draw — one hand
- Seven-Card Stud — one hand
- Baseball — one hand
- Follow the Queen — one hand
- Chicago — one hand
- Anaconda / Pass the Trash — one hand
- High-Low — one hand
- Lowball — one hand
- Dealer Blackjack — one 52-card deck
- Dealer's Wild — one hand using supported dealer-selected wild-card rules

Custom house games are a planned later feature, but the engine should be designed around reusable primitives from the beginning: deal face-up/down, betting round, draw/discard, pass, reveal, wild-card rule, high/low evaluation, split pot, special-card event, and game completion.

## Possible later call: Texas Hold'em

Texas Hold'em can fit Dealer's Choice, but it should not be an unlimited run that takes over the whole night. If added, its natural endpoint should be **one full blind orbit**: the small blind and big blind advance normally until every active seat has occupied the blind positions for the called mini-session, then Hold'em ends cleanly and the outer Dealer's Choice dealer button advances to the next caller.

The called-game engine should therefore distinguish the **inner game button/blinds** from the **outer Dealer's Choice dealer/caller**. Pots are settled after every Hold'em hand; the table is then cleared for the next hand inside that one-orbit mini-session. When the orbit finishes, control returns to Dealer's Choice.

This is a design note, not a v1 requirement.

## Dealer Blackjack

Dealer Blackjack is intentionally different from the poker variants.

- The current Dealer's Choice dealer becomes the house.
- Use one standard 52-card deck, shuffled once at the beginning of the dealer's Blackjack turn.
- Used cards remain discarded; do not reshuffle between rounds.
- All other active players play individually against the dealer.
- Continue rounds until the engine determines there are not enough cards to safely begin another round.
- The UI should show cards remaining and identify the final round when known.
- When the deck session ends, settle the dealer's net Blackjack result and rotate the Dealer's Choice dealer button.
- Working house rule: dealer wins ties.
- Working payout rule: Blackjack pays even money (1:1).
- Exact Blackjack rules and house edge must be simulation-tested before release. Do not lock a ruleset merely because it sounds fair.

The dealer's per-round exposure should be bounded by the allowed player wagers; the game must not allow an arbitrary oversized wager to destroy the larger Dealer's Choice session.

## Chips and rebuys

Chips are fictional game units. Play Amplified does not sell, cash out, transfer, or settle money for Dealer's Choice.

Default rules:

- Equal starting stack for every player. Initial working default: **1,000 chips**.
- A player who reaches zero may choose **Rebuy** or **Sit Out**.
- A rebuy always issues exactly one original starting stack.
- Other players do **not** receive chips when somebody rebuys. The busted player's original chips are already distributed among the table.
- Default maximum: **2 rebuys per player**.
- Host may configure supported rebuy limits before the session (for example none, one, two, or unlimited if later permitted by product rules).
- Every issuance is recorded permanently in the session ledger.

### Final performance

Raw stack is not enough because rebuys create additional issued chips.

`netResult = endingStack - totalChipsIssuedToPlayer`

Example: a player starts with 1,000, takes two 1,000-chip rebuys, and ends with 2,400. Total issued is 3,000, so net result is -600.

The final screen should show ending stack, rebuys, total issued, and net result. Primary competitive ranking should use net result unless a future explicitly named session mode defines a different victory condition.

## Session formats

Initial formats to support or design toward:

- **One Orbit** — every player gets the deal once.
- **Three Orbits** — every player gets the deal three times; working standard format.
- **Timed Night** — 30 / 60 / 90 minute choices, with the current called game allowed to finish cleanly.
- **Host End** — open-ended private poker night; host ends the session between called games.

Dealer order must remain deterministic through reconnects and refreshes.

## Game library presets

Room creation should eventually allow the host to limit what can be called:

- **Classic** — traditional draw/stud/low/high variants.
- **College Night** — wild-card and house-style games plus Blackjack.
- **Everything** — every supported built-in game.
- **Our Games** — future saved group/custom variants.

## Remote multiplayer and secrecy requirements

The server is authoritative for all hidden information.

- Shuffle and deck order live server-side.
- A client must never receive another player's unrevealed private cards.
- A client must never receive future undealt cards.
- Public/exposed cards are projected only when the called game's rules make them public.
- Refresh/reconnect restores only the viewer's permitted state.
- Joining late cannot expose prior/future private state.
- Spectator support, if ever added, uses a separate projection with no private cards.
- Never rely on CSS or client-side hiding for card secrecy.
- Server validates every bet, call, raise, fold, hit, stand, double, draw, discard, pass, reveal, and special-rule action.
- Duplicate taps/actions must be idempotent or rejected safely.

## Social design

This is a private-friends card night, not anonymous public poker matchmaking.

- Host creates room; friends join by link/code.
- Each player uses their own device for private cards/actions.
- The table view shows dealer position, public cards, pot, chip stacks, action state, and called game.
- Voice/video does not need to be built into v1; friends can use their preferred calling service while playing.
- The dealer-selection moment should have personality: `CHANNING HAS THE DEAL — CALL YOUR GAME`.
- Rules for an unfamiliar called game should be explained briefly before the first action, then the UI should present only legal choices.

## Product restraint

Do not add power-up cards, veto tokens, or unrelated arcade modifiers to the core version. The changing dealer and changing game are already the source of variety. The software's job is to make complicated dealer's-choice play effortless and trustworthy.

## Future: Create Your Own Game

Do not make the custom builder a v1 dependency, but preserve an architecture that can later represent saved house games from supported primitives. A future group should be able to recreate a named college rule set such as `Channing's Baseball` and save it to its private table library.

Custom games must be constrained to rules the authoritative engine can validate. Do not execute arbitrary user-authored code or trust clients to enforce custom rules.

## Build phases

### Phase 1 — engine foundation
- room/session model
- player seats and deterministic dealer rotation
- server-authoritative cryptographic shuffle/deck state
- per-viewer state projection
- fictional chip ledger and rebuy accounting
- generic game-definition/state-machine contract
- betting/pot/side-pot primitives
- poker hand evaluator with wild/high/low hooks
- reconnect, stale-action, and duplicate-action protections

### Phase 2 — first playable games
- Five-Card Draw
- Seven-Card Stud
- Dealer Blackjack

These three deliberately exercise different engine capabilities: draw poker, exposed/private staged poker, and a multi-round dealer-as-house game.

### Phase 3 — college-night library
- Baseball
- Follow the Queen
- Chicago
- Anaconda
- High-Low
- Lowball
- Dealer's Wild

### Phase 4 — polish
- library presets
- One Orbit / Three Orbits / Timed Night
- end-of-night statistics and net leaderboard
- responsive/mobile certification
- recovery/rejoin certification
- security/adversarial state-projection tests

### Phase 5 — house games
- constrained custom-game composer
- saved group rules
- named house variants

## Release gate

Dealer's Choice is not `live` or purchasable until multiplayer secrecy, betting/pot settlement, rebuys, reconnects, dealer rotation, and every included variant pass automated and multi-device certification. Until then it should remain concept/building and should not be added to the sales-ready catalog.
