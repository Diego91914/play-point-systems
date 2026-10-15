# Play Amplified Events — Product Foundation

Status: **Approved direction / implementation foundation**

## Product decision

Play Amplified Events is a B2B and organized-event offering inside the Play Amplified platform.

It is **not** a separate game and it should not become a parallel game engine. It is the orchestration layer that lets an organizer combine teams, registration, games, challenges, standings, awards, and event branding into one coordinated experience.

## Brand hierarchy

- **Company:** Play Point Systems, LLC
- **Platform:** Play Amplified
- **Organized-events offering:** Play Amplified Events
- **Flagship sports package:** Shot Caddy Event Kit
- **Additional packages:** Corporate Challenge, Community & Fundraiser, church/community outings, customer appreciation, and future golf/disc-golf tournament packages

The business sells the event experience. Individual games remain products inside that experience.

## Core promise

**One event. One join point. Multiple ways to play. One shared result.**

The Event Hub should eventually let an organizer:

- create an event
- invite participants through one QR code or event link
- create teams manually or automatically balance them by skill
- assign games and challenges to stations, rounds, or scheduled blocks
- run individual and team competitions
- combine results into one event-points leaderboard
- display live standings on phones, televisions, or projectors
- recognize team champions and individual award winners
- add sponsor or company-specific challenges and branding

## Shot Caddy Event Kit

The original corporate disc golf concept remains a signature event package rather than being discarded or renamed into a generic event.

Recommended small-group format:

- 6 players
- 3 two-person teams

Hole-specific championships:

| Hole type | Competition |
| --- | --- |
| Par 3 | Closest to the Pin |
| Par 4 | Approach Champion |
| Par 5 | Drive Champion |

Team CSP and other Shot Caddy competition formats can feed both individual awards and overall team event points.

## Multi-game event model

A Play Amplified corporate event should be able to combine experiences such as:

- Shot Caddy Team CSP
- Closest to the Pin
- Approach Champion
- Drive Champion
- Clear the Stack
- company or sponsor trivia
- selected social/team games
- custom challenges

The event leaderboard belongs to Play Amplified Events. Each underlying game keeps its own gameplay authority and rules.

## Product guardrails

1. **Do not rebuild existing game engines inside Events.** Events should consume results through adapters/contracts.
2. **Do not replace the simple host/join flows for ordinary play.** Events are an organized layer for larger experiences.
3. **One event registration should be reusable across included activities where practical.** Do not force participants to re-register for every station.
4. **Keep organizer controls separate from participant views.** The Event Hub is an organizer product; players should get a focused next-action and standings experience.
5. **Do not tie event identity to disc golf.** Shot Caddy is the flagship sports package, while Play Amplified Events supports broader engagement.
6. **Do not hard-code public pricing yet.** The June 2026 $199–$499 range remains useful as a historical self-service hypothesis, but pricing should be validated against pilots and the larger multi-game value proposition before being locked.

## Implementation phases

### Phase 1 — Product foundation

- public `/events` positioning page
- canonical event-template definitions
- Shot Caddy Event Kit preserved as a flagship package
- Event Hub visual concept
- no database, entitlement, commerce, or production workflow changes

### Phase 2 — Organizer foundation

- authenticated event creation
- event profile and schedule
- participant QR registration
- team creation and automatic balancing with manual override
- organizer roster controls

### Phase 3 — Shared competition layer

- event-points model
- result adapters from approved Play Amplified games
- live team and individual leaderboards
- station/round status and next-action participant view
- championship and award tracking

### Phase 4 — Commercial event tooling

- corporate branding and sponsor placements
- reusable event templates
- exports and post-event results
- projector/TV leaderboard mode
- facilitator tools
- charity, church/community, customer-appreciation, and traditional-golf packages

## Release isolation

This foundation must remain isolated from current session/database repair work, Shot Caddy gameplay fixes, and the consumer navigation/storefront PR streams. Any navigation entry point for Events should be coordinated with the accepted Play Amplified navigation architecture rather than added opportunistically.
