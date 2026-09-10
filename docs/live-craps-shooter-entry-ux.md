# Live Craps — Shooter Dice Entry UX

Status: LOCKED production direction

After the Dice Out countdown reaches zero, the current shooter's phone leaves the betting-table interaction and becomes a dedicated physical dice-entry controller.

## Screen
Display two very large six-face selectors:

- DIE 1: 1 2 3 4 5 6
- DIE 2: 1 2 3 4 5 6

Use large square touch targets suitable for one-handed standing use. A selected face must remain unmistakably highlighted. Do not require typing or a small numeric keypad.

After both faces are selected, show the composition and total prominently, e.g. `4 + 3 = 7`. Preserve both individual faces server-side; total alone is insufficient because hardway/easy-way settlement depends on composition.

## Confirmation
Before settlement, show two large actions:

- CONFIRM ROLL
- CHANGE DICE

Confirmation is shooter-only. Once confirmed, the dice entry is immutable and may proceed to authoritative settlement. Before confirmation, either die may be changed freely.

## Other players
Non-shooter phones remain in the locked/waiting state and must never receive dice-entry controls.

## Timing
The dedicated entry screen appears when the configured 10/15/20 second Dice Out countdown expires. If product testing shows that immediate post-throw entry is desirable, the shooter may also be allowed to open the same entry controller while Dice Out is active; the underlying confirmation rules remain identical.
