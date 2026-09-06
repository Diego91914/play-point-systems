# Play Amplified Trivia — Venue Mode

Status: LOCKED PRODUCT DIRECTION

## Product shape
Venue Mode is a continuous restaurant/bar/event trivia experience shown on a television or projector while players answer from their own phones.

The TV is the public game board. Phones are private answer pads.

## Core venue loop
1. Venue starts one long-running Venue Session.
2. TV shows a persistent venue QR code and short join code.
3. Guests scan once, enter a nickname, and join without creating an account.
4. Trivia runs continuously: countdown → question → answers → reveal → leaderboard → next question.
5. Players may join at any point while the venue session is live.
6. Hourly Championship moments recognize the strongest active players without requiring the entire game to reset.

## Presence rules
Joining and physical-presence validation are separate from leaderboard activity.

### Presence authorization
- Initial venue QR scan grants 60 minutes of venue-presence authorization.
- Presence authorization does not reset scores or require a new nickname.
- When authorization expires, the phone may continue to view the public game state but cannot submit another answer until presence is refreshed.
- Refresh requires scanning the current QR displayed at the venue.
- A successful refresh extends authorization another 60 minutes.
- No GPS permission and no venue Wi-Fi requirement.

### Activity / leaderboard visibility
- Missing a question does not mean the guest left the venue.
- After 3 consecutive missed questions, a player becomes idle and is hidden from the active leaderboard.
- An idle player who answers again immediately becomes active and returns to the leaderboard with score/history intact, provided presence authorization is still valid.
- Expired presence and inactivity are distinct states.

### Player states
- `active`: eligible to answer and visible on the active leaderboard.
- `idle`: currently hidden from the active leaderboard due to missed questions, but eligible to return immediately if presence is valid.
- `presence_expired`: may watch but must rescan the venue QR before submitting another answer.
- `removed`: venue staff intentionally removed/blocked the player.

## Fairness model
Venue Mode must not rank customers only by all-night cumulative points because earlier arrivals would have a structural advantage.

Primary public leaderboard: rolling performance window (target: latest 10–15 answered questions; exact window may be tuned in playtesting).

Secondary recognition can include:
- Current streak
- Accuracy tonight
- Fastest correct answer
- Hourly championship wins

Hourly Championship does not force players to sign in again and does not end the venue session. It is a recognition/payoff event inside continuous play.

## QR architecture
The venue should have a stable public destination, for example:
`/join/<venue-slug>`

The stable venue identity resolves to the currently active Venue Session. The TV QR encodes both the venue/session identity and a rotating presence proof. Printed table/menu QR codes may identify the venue, but only the current on-screen QR can renew physical-presence authorization after the initial window expires.

## TV mode
TV/projector presentation should show:
- Play Amplified Trivia branding
- Venue name
- Persistent/scannable QR
- Join code or short venue identifier
- Countdown
- Question and choices
- Answer participation count
- Correct-answer reveal
- Active leaderboard
- Hourly Championship winner moments

The TV should run with minimal employee interaction.

## Venue controls
Required operator controls:
- Pause / Resume
- Skip Question
- End Venue Session
- Remove / Ban Player
- Hide or moderate nickname

Nickname profanity filtering is required before public venue release.

## Commercial boundary
Venue Mode is a separate product capability from normal Home/Table Trivia. Future Stripe wiring should be able to gate persistent venue sessions, venue QR identity, TV mode, moderation, and venue analytics under a Restaurant/Venue entitlement without weakening normal consumer Trivia access.

## Locked principles
- Scan once, then play continuously for about an hour without revalidation friction.
- Revalidation proves presence; it does not create a new player or reset score.
- Three missed questions hides an idle player from the active leaderboard.
- Returning activity restores the player immediately when presence remains valid.
- Presence expires hourly; the competition does not reset hourly.
- No GPS and no required venue Wi-Fi.
- Venue Trivia is continuous, drop-in/drop-out, and designed for real restaurant dwell time.
