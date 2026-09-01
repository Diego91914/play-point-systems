# Play Amplified Murder Mystery — Locked Design Rules

## Core phone principle
The phone is the brain and the guide. The people are the game.

The phone manages hidden knowledge, private memory, question prompts, evidence timing, turn order, personal discoveries, case building, scoring, and the final reveal. Players speak, bluff, question, defend, accuse, and solve face-to-face.

## Unique-path rule
**Everyone investigates the same murder. Nobody experiences exactly the same case.**

The game uses three knowledge layers:
1. **Common evidence** — objective evidence intentionally shown to everyone.
2. **Private clues** — truthful information shown only to a particular role/player. It remains private unless that player chooses to share it.
3. **Personal discoveries** — investigator-only connections earned by the questions that player personally chose to pursue. Other players do not automatically receive those discoveries just because they heard the spoken answer.

Spoken interrogation answers are common knowledge because the room heard them. The phone may privately tell the investigator that an answer connects to something else in that investigator's Case File. That connection belongs only to that investigator unless they decide to reveal it.

Private information may be shared voluntarily, but the game never automatically pools every player's private Case File. This creates strategic tension between helping the room secure a conviction and protecting the strength of your own final case.

## Unopened / undiscovered evidence rule
Evidence may exist before the investigation without automatically becoming known merely because the game started.

Examples include sealed letters or envelopes, scheduled messages, voicemail or voice-memo drafts, hidden photographs, wills, legal instructions, journals, USB drives, locked drawers, safes, packages, receipts, or records a player forgot they possessed.

A player may need to remember, discover, unlock, open, search for, listen to, ask about, or voluntarily reveal this evidence. The phone may privately remind a player that an item exists and offer an ordinary story decision.

Unopened or undiscovered evidence may strengthen a case, unlock a new investigative avenue, alter the meaning of an earlier clue, create a private advantage, or contribute to a hidden branch. It may not be the sole fact required to solve the mystery at the advertised minimum player count.

## Two-stage hidden branch rule
**Blackwood House does not need to determine the final authored truth after a single hidden choice. Two separate private story decisions can combine before the case path is locked.**

The current Blackwood branch tree is 2 × 2, creating four possible authored paths:

- Branch Point 1: the Younger Sister decides whether to **OPEN THE LETTER** or **KEEP IT SEALED**.
- Branch Point 2: later, the Private Chef decides whether to **LISTEN TO THE DRAFT** or **LEAVE IT UNPLAYED**.

The player making either decision experiences only the story choice. Neither phone says that the choice is selecting, narrowing, or determining a murderer.

The four hidden combinations may map to four separately authored culprit variants. The case remains branch-safe until both hidden signals exist. Only then may the server silently lock the final authored truth.

This branching structure must obey these rules:
- early objective facts must remain compatible with all still-eligible paths
- the first hidden branch narrows possibilities but does not expose or necessarily lock the final truth
- the second hidden branch completes the path and allows the case truth to become canon
- branch points should preferably belong to different players so one person does not unknowingly control the whole tree
- once a case becomes canon, later evidence may reveal it but may never rewrite it
- players are never shown branch labels, variant IDs, branch progress, or the branching machinery
- unfinished variants may exist in development but may never become active in live play
- each of the four authored paths must independently satisfy minimum-player solvability and timeline/evidence logic checks before release

The design goal is that players think, **“I chose whether to open the letter,”** and **“I chose whether to listen to the recording,”** while never realizing those choices helped shape which version of Blackwood House they are uncovering.

## Multiple-solution / rotating-culprit framework
A single story world may support more than one authored culprit, allowing the same mystery setting and cast to play differently across sessions.

This is not accomplished by randomly relabeling the murderer while leaving the evidence unchanged. Each possible culprit must have a complete authored solution path with its own motive, opportunity, false or incomplete alibi, physical or digital evidence trail, cleanup or escape behavior, private clues and discoveries, truthful red herrings, conviction scoring key, and reveal narrative.

For the current two-stage Blackwood framework, the four development paths are:
- Old Friend
- Business Partner
- Younger Sister
- Private Chef

Only variants explicitly marked release-ready may become live case truths. Familiarity with Blackwood House should never automatically reveal who the murderer is.

## Conviction rule
The ending is **Build Your Case**, not a one-tap accusation.

Every player submits a private theory including who committed the murder, motive, crime location, murder window, and supporting facts from that player's own Case File.

A correct suspect alone is never enough for a conviction. The case must clear a hidden conviction threshold and include multiple correct supporting links. The highest-scoring non-murderer case that reaches the conviction standard wins.

For Blackwood House the current scoring target is 12 points: murderer 4, motive 2, location 1, murder window 1, and up to four correct supporting links 4. Conviction currently requires the correct murderer, at least 8 total points, and at least 2 correct supporting links.

## Minimum-player solvability rule
Every mystery must be completely solvable at its advertised minimum player count. For Murder at Blackwood House, the minimum is 4 players.

The four core roles are always present: Old Friend, Business Partner, Younger Sister, and Private Chef. This is deliberate: the four-role core can also support the four-path development tree without depending on optional 5–8 player roles.

Players 5–8 add suspects, secrets, alibis, red herrings, corroboration, and investigative depth. They may never carry information required to solve the minimum-player version.

## Investigation structure
- 4–8 players
- private character brief and timeline on each phone
- investigator taps a suspect and chooses an available question
- target phone supplies what must be revealed and what may remain private
- target answers aloud in their own words
- investigator phone may add a private discovery based on that player's path
- phones interrupt with new common evidence and role-specific private clues
- unopened or undiscovered evidence creates optional investigative avenues
- two separate early/private story choices may form the hidden 2×2 branch tree
- no branch machinery is exposed to players
- after the active truth is locked, all later evidence, personal discoveries, scoring, and reveal must read from that variant
- every player privately builds a complete case
- highest-scoring valid conviction wins; if nobody convicts, the murderer wins

## Truthful misdirection rule
The phone may misdirect through truthful, incomplete information, suspicious wording, innocent secrets, coincidences, red herrings, private clues, timed interruptions, dormant evidence avenues, and branch-safe ambiguity. It never presents fabricated or objectively false evidence as fact.

## No-required-notes rule
Players may take notes if they enjoy it, but note-taking is never required. The phone remembers evidence, private clues, personal discoveries, unopened/undiscovered evidence the player actually encountered, and important interview history. The phone organizes facts; the players make deductions.

## Content standard
Every playable character must have a public relationship to the victim, private backstory, timeline around the murder, plausible motive or suspicious circumstance, private secret, information they know about the case, explicit innocence or murderer objective for the active variant, and authored responses to every interrogation question.

Every mystery and every culprit variant must be logic-checked so timelines, evidence, private discoveries, dormant evidence, hidden branch compatibility, scoring paths, and required clues remain consistent at every supported player count.
