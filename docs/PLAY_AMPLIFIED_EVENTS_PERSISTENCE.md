# Play Amplified Events — Persistence and Registration

Status: **Draft implementation / not deployed**

## Lifecycle

Play Amplified Events uses an explicit organizer-controlled lifecycle:

1. `draft` — organizer creates the event, chooses a kit, builds any preloaded roster, and sets the team count.
2. `published` — the system assigns a real join code and opens QR registration. Draft configuration is locked so check-ins cannot be accidentally rewritten.
3. `live` — the organizer refreshes the roster, balances teams, and starts the event. Team membership is persisted and registration closes.
4. `complete` / `archived` — reserved for the scoring and event-history phases.

## Data authority

The new tables are intentionally separate from both `ppl_league_*` and the older Play Point Live `ppl_events` model:

- `ppl_amplified_events`
- `ppl_amplified_event_participants`
- `ppl_amplified_event_activities`
- `ppl_amplified_event_teams`
- `ppl_amplified_event_team_members`

League Night remains a specialized tournament workflow. Existing games remain authoritative for their own rooms, scoring, and results.

## Authorization

Organizer routes use the existing signed Play Amplified games-session cookie and compare its subject to `owner_user_id` on every organizer read/write.

The database continues the hardened server-only access model:

- RLS enabled on all new tables.
- no `anon` or `authenticated` table privileges.
- explicit service-role grants only.
- public QR registration passes through server routes; browsers never receive direct database access.

## Registration behavior

Publishing creates a unique 6-character code and opens `/events/join/[code]`.

A participant can scan the QR and enter a name without creating an account. If exactly one preloaded roster entry matches the name, that entry is checked in. Otherwise a QR participant is added with neutral skill value `3` so the organizer can include that person in balancing.

Registration remains open only while the event is `published`. Starting the event closes registration.

## Team lock

Starting requires every registered participant to appear on exactly one submitted team. The server validates membership against the event roster before persisting teams. If member insertion or event start fails, newly created team rows are removed so a partially started event is not left behind.

## Not included yet

This slice does **not** connect game results to event points, calculate event standings, provide TV/projector mode, complete/archive events, expose sponsor tooling, or execute the migration in production.

Those features belong to the event-result adapter and live Event Hub phases after this persistence layer is reviewed and approved.
