# The Inside Man — MVP

A 4–10 player face-to-face social deduction game powered by private phones.

## Match
- Five missions are drawn from a 60-scenario launch pool.
- One player is secretly assigned Inside Man for the whole match.
- Crew wins by completing three missions or convicting the Inside Man.
- Inside Man wins by causing three sabotage points or surviving the match with enough damage.

## Mission
- Every player sees the shared scenario and six choices.
- Each player privately locks exactly three choices after face-to-face discussion.
- The three choices with the most votes become the group decision; ties resolve by stable choice order.
- A mission succeeds when the group selects the scenario's three safe/core choices.
- Every player also has a private objective. Crew objectives point toward useful choices; the Inside Man gets a sabotage target. This gives innocent players a reason to push suspiciously hard for something.

## Deduction
- After a mission reveal, the host can open accusations or continue.
- Each player has one accusation for the entire match; passing does not spend it.
- A clear target with at least two accusations goes to trial.
- The accused defends themselves aloud. Everyone else votes privately Guilty / Not Guilty.
- Convicting the Inside Man wins immediately for Crew.
- A wrong conviction gives the Inside Man one sabotage point; nobody is eliminated from play.

## Room model
- Hosting requires a Play Point Games account.
- Guests join by QR/link or six-character room code with first name only.
- Private player sessions use random bearer tokens stored only as SHA-256 hashes in room state.
- Room state is server-side in `ppl_inside_man_rooms`, protected from anon/authenticated table access and mutated through server APIs with optimistic version checks.
