# On My List

A phone-powered family table game where one player creates the survey board.

## Round
1. One player is the Surveyed Player.
2. The app asks a list question about that player.
3. The Surveyed Player privately enters the required 5–7 answers in ranked order.
4. Rank value is automatic: a 5-answer board scores 5/4/3/2/1, a 6-answer board 6–1, and a 7-answer board 7–1.
5. Everyone else is randomized into a guessing order.
6. On their turn a guesser says one answer aloud.
7. The Surveyed Player responds verbally.
8. If wrong, the guesser taps MISS. Two misses eliminates that guesser for this board only.
9. If correct, the guesser taps GOT IT. The Surveyed Player then selects the matching answer on their private phone. That answer reveals for everyone and its rank points go to the guesser.
10. Play continues until all answers are found or every guesser has two misses.
11. Any unrevealed answers are shown, then the Surveyed Player rotates.

Each player is Surveyed Player twice. Highest individual score wins.

## Control model
- Guesser: GOT IT / MISS.
- Surveyed Player: privately builds and ranks board; confirms a GOT IT by choosing the matching answer to reveal.
- Server: validates turns, scores, misses, eliminations, reveals, rotation, and final standings.
