# Quick Score Backyard Club Implementation Spec

This document turns the Quick Score retention layer into a build-ready implementation plan for the Play Point Live codebase.

The core product shift is simple:

Quick Score should remember the people, not just the score.

That means the long-term system is not primarily a bracket engine or a tournament tool. It is a lightweight memory system for recurring backyard groups that can later support standings, championships, and tournaments without making first-run scoring slower.

## Product Thesis

Quick Score must stay excellent at one immediate promise:

- start a match in under 10 seconds
- show a readable score from across the yard
- settle the "what was the score?" problem fast

Backyard Club should add meaning after the match, not friction before it.

The scoreboard remains the front door.
The memory layer becomes the reason people keep coming back.

## Why `Club` Instead Of `League`

`League` is too narrow for the way people actually play.

Examples that fit `Club` naturally:

- Friday Night Cornhole
- Family Reunion
- Church Picnic
- Cabin Weekend
- Neighborhood BBQ
- Couples Night
- Guys Night

Inside a club, users may eventually run:

- casual matches
- recurring standings
- tournaments
- championships

So the right internal architecture is:

```text
Club
  -> Event
  -> Match
  -> Quick Score Session
  -> Result
  -> Memory
  -> Story
```

## Current Codebase Fit

This plan intentionally wraps around the existing Quick Score flow rather than replacing it.

Relevant files today:

- [app/live/quick-score/page.tsx](/C:/Projects/play-point-systems/app/live/quick-score/page.tsx)
- [app/live/quick-score/[sessionCode]/page.tsx](/C:/Projects/play-point-systems/app/live/quick-score/[sessionCode]/page.tsx)
- [lib/play-point-core/quick-score.ts](/C:/Projects/play-point-systems/lib/play-point-core/quick-score.ts)
- [app/api/live/quick-score/sessions/create/route.ts](/C:/Projects/play-point-systems/app/api/live/quick-score/sessions/create/route.ts)
- [app/api/live/quick-score/sessions/[code]/route.ts](/C:/Projects/play-point-systems/app/api/live/quick-score/sessions/[code]/route.ts)
- [app/api/live/quick-score/sessions/[code]/update/route.ts](/C:/Projects/play-point-systems/app/api/live/quick-score/sessions/[code]/update/route.ts)
- [app/api/auth/anonymous/ensure/route.ts](/C:/Projects/shot-caddy-web/app/api/auth/anonymous/ensure/route.ts)
- [app/api/tools/random-doubles/league/route.ts](/C:/Projects/shot-caddy-web/app/api/tools/random-doubles/league/route.ts)

The existing Quick Score session system already gives us the right launch behavior for the MVP:

- anonymous-first
- mobile-friendly
- host-driven
- live updates
- fast setup

Backyard Club should attach optional context to that session model.

## Non-Negotiable UX Rule

Quick Match must remain frictionless.

First-time users should still be able to do this:

```text
Quick Match
  -> Choose game
  -> Enter competitors
  -> Start scoring
```

No club should be required.
No event should be required.
No account wall should be required.

Club features should appear only when someone wants memory, continuity, or context.

## Data Model

### `clubs`

Represents the recurring group.

Suggested fields:

```ts
type ClubRecord = {
  id: string;
  owner_user_id: string | null;
  owner_anonymous_id: string | null;
  name: string;
  slug: string;
  status: "active" | "archived";
  sport_keys: string[];
  location_label: string | null;
  notes: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
```

### `club_participants`

Represents the people the app remembers.

Suggested fields:

```ts
type ClubParticipantRecord = {
  id: string;
  club_id: string;
  display_name: string;
  normalized_name: string;
  aliases: string[];
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};
```

Notes:

- `normalized_name` helps dedupe "Buck" vs "buck"
- `aliases` helps absorb common nickname drift later

### `events`

Events sit inside a club and group one session or one night together.

Examples:

- Week 6
- Friday Night Cornhole
- Memorial Day Cookout
- Cabin Weekend Saturday

Suggested fields:

```ts
type QuickScoreEventRecord = {
  id: string;
  club_id: string;
  name: string;
  event_type: "casual" | "league_night" | "tournament" | "championship";
  status: "draft" | "live" | "complete" | "archived";
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
};
```

### `matches`

A match is the competitive wrapper around one Quick Score session.

Suggested fields:

```ts
type QuickScoreMatchRecord = {
  id: string;
  club_id: string;
  event_id: string | null;
  quick_score_session_code: string | null;
  sport_key: string;
  format_key: string | null;
  participant_ids: string[];
  team_labels: string[] | null;
  winner_participant_ids: string[] | null;
  winning_label: string | null;
  status: "scheduled" | "live" | "complete" | "void";
  started_at: string | null;
  completed_at: string | null;
  summary: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
```

## Session Context Extension

Quick Score session state should stay usable without any club context.

Add optional metadata only:

```ts
type QuickScoreSessionContext = {
  clubId?: string | null;
  eventId?: string | null;
  matchId?: string | null;
  participantMap?: Array<{
    slotId: string;
    clubParticipantId: string;
    displayName: string;
  }>;
};
```

This should attach to the existing session payload without changing baseline scoring behavior.

## Emotional Stats Only For MVP

The app should surface stats people actually talk about in the yard.

Keep:

- current streak
- best streak
- head-to-head record
- last meeting result
- club leader
- longest rivalry

De-emphasize or skip for MVP:

- points for
- points against
- differential
- win percentage

Those can still exist in raw data later, but they should not drive the first memory UI.

## Story Engine V1

The story layer should be deterministic templates, not AI.

It simply reads the saved match history and outputs short lines that add context.

Recommended helper:

- [lib/play-point-core/quick-score-club-story.ts](/C:/Projects/play-point-systems/lib/play-point-core/quick-score-club-story.ts)

### Pre-Match Story Types

- Rivalry Match
- Streak On The Line
- First Place Opportunity
- Revenge Match
- New Challenger

Example outputs:

- `Rivalry Match: Buck leads Gary 12-11.`
- `Gary won the last meeting 21-19.`
- `If Channing wins tonight, he takes over first place.`
- `Buck is on a 4-match streak.`

### Post-Match Story Types

- New leader
- Streak snapped
- Revenge completed
- Biggest upset
- Sweep night
- Clutch finish

Example outputs:

- `New leader: Gary moves into first place.`
- `Streak snapped: Buck's 5-match run is over.`
- `Revenge completed: Channing evens the season series.`

## API Surface

Recommended endpoints:

### Clubs

- `POST /api/live/quick-score/clubs`
- `GET /api/live/quick-score/clubs`
- `GET /api/live/quick-score/clubs/[clubId]`
- `PATCH /api/live/quick-score/clubs/[clubId]`

### Participants

- `POST /api/live/quick-score/clubs/[clubId]/participants`
- `PATCH /api/live/quick-score/clubs/[clubId]/participants/[participantId]`

### Events

- `POST /api/live/quick-score/clubs/[clubId]/events`
- `GET /api/live/quick-score/clubs/[clubId]/events`

### Matches

- `POST /api/live/quick-score/clubs/[clubId]/matches`
- `POST /api/live/quick-score/clubs/[clubId]/matches/[matchId]/complete`
- `POST /api/live/quick-score/clubs/[clubId]/matches/[matchId]/void`

## UI Structure

### 1. Quick Match

This remains the default entry point.

User flow:

- pick game
- enter competitors
- start immediately

Optional enhancement:

- `Save this to a club`

### 2. Club Home

Shows:

- club name
- recent matches
- current leader
- active streak
- rivalry spotlight
- event list

### 3. Event Screen

Shows:

- event title
- match list
- standings summary
- story highlights

### 4. Match Intro Card

Shown before a saved club match begins.

Example:

```text
Rivalry Match
Buck leads Gary 12-11
Last meeting: Gary won 21-19
```

This is the right place to make the match feel meaningful without slowing normal scoring.

### 5. Match Summary Card

Shown after completion.

Example:

```text
Streak Snapped
Gary ends Buck's 4-match winning streak.
```

## Suggested Library Split

### `lib/play-point-core/quick-score-club.ts`

Responsibilities:

- club CRUD helpers
- participant matching
- event helpers
- match creation/completion helpers
- streak and head-to-head calculations

### `lib/play-point-core/quick-score-club-story.ts`

Responsibilities:

- generate pre-match story cards
- generate post-match story cards
- rank the best story to display

### `lib/play-point-core/quick-score.ts`

Keep focused on:

- live scoring session state
- session creation and updates
- read/write helpers

Do not overload this file with club intelligence if we can avoid it.

## Database Rollout

Recommended migration order:

1. `quick_score_clubs`
2. `quick_score_club_participants`
3. `quick_score_events`
4. `quick_score_matches`
5. optional session linkage fields if they are not stored inside session JSON

Suggested table names should stay explicit:

- `quick_score_clubs`
- `quick_score_club_participants`
- `quick_score_events`
- `quick_score_matches`

That keeps them clearly scoped and avoids collisions with the broader Play Point Core event system.

## MVP Build Order

### Phase 1: Club Shell

Build:

- clubs table
- participants table
- create/list club APIs
- basic club home screen

Success condition:

- a user can create a club and add recurring people

### Phase 2: Event And Match Loop

Build:

- events table
- matches table
- optional link from a Quick Score session into a saved match
- match completion persistence

Success condition:

- a finished Quick Score game can be saved to a club as a match result

### Phase 3: Memory Layer

Build:

- current streak
- best streak
- head-to-head
- last meeting
- club leader

Success condition:

- the app can explain why tonight's match matters

### Phase 4: Story Layer

Build:

- pre-match narrative cards
- post-match narrative cards
- story priority rules

Success condition:

- the app creates memorable context without adding complexity to live scoring

## Implementation Notes

- Keep anonymous-first support because Quick Score's speed depends on it.
- Let users create a club later from match history rather than forcing it upfront.
- Favor deterministic templates over generative AI for reliability and speed.
- Preserve single-session performance. Club context should be optional metadata, not a hard dependency.

## What Not To Build Yet

Do not lead with:

- 32-team brackets
- advanced seeding
- manual standings editors
- points differential dashboards
- commissioner-heavy admin tools

Those are power features.
Backyard Club should first make repeated casual play feel more meaningful.

## Definition Of Done For V1

Backyard Club MVP is ready when:

- Quick Match is still startable in under 10 seconds
- a user can create a club and save recurring players
- a finished match can be attached to a club
- the app can show head-to-head and streak context before a match
- the app can show a story-style recap after a match

At that point, Quick Score stops being just a scoreboard and starts becoming a memory system.
