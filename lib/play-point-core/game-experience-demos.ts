import type { MasterGameEntry } from "./master-game-catalog";

export type GameDemoStep = {
  eyebrow: string;
  headline: string;
  detail: string;
  phoneLabel?: string;
  phoneBody?: string;
  accent?: "cyan" | "amber" | "emerald" | "violet" | "rose";
};

export type GameExperienceDemo = {
  hook: string;
  payoff: string;
  facts: readonly string[];
  steps: readonly GameDemoStep[];
};

const demos: Record<string, GameExperienceDemo> = {
  "chain-reaction": {
    hook: "Watch a normal table turn into a race to connect the dots.",
    payoff: "The fun is hearing everyone confidently say the wrong thing right before somebody suddenly sees the connection.",
    facts: ["Face-to-face", "Private target", "Fast rounds", "No app download"],
    steps: [
      { eyebrow: "Secret setup", headline: "One player gets the hidden target", detail: "Only the guide sees where the chain needs to end.", phoneLabel: "YOUR TARGET", phoneBody: "BEACH", accent: "violet" },
      { eyebrow: "The table starts talking", headline: "SAND → CASTLE → OCEAN", detail: "Every answer changes what the next person thinks the connection might be.", phoneLabel: "CURRENT WORD", phoneBody: "OCEAN", accent: "cyan" },
      { eyebrow: "The moment", headline: "TARGET REVEALED: BEACH", detail: "The room instantly replays the whole chain and argues about who almost gave it away.", phoneLabel: "CHAIN COMPLETE", phoneBody: "+1 POINT", accent: "emerald" },
    ],
  },
  "how-close": {
    hook: "Find out how well the people at the table actually know each other.",
    payoff: "Every answer becomes a tiny debate about personality, habits, and who understands whom best.",
    facts: ["1–100 scale", "Private answer", "Group prediction", "Conversation-first"],
    steps: [
      { eyebrow: "Spotlight", headline: "How likely are you to sing karaoke?", detail: "The Spotlight Player secretly answers from 1 to 100.", phoneLabel: "YOUR ANSWER", phoneBody: "72", accent: "violet" },
      { eyebrow: "Everyone guesses", headline: "The table locks in predictions", detail: "43. 68. 75. 91. Nobody can see the real answer yet.", phoneLabel: "YOUR GUESS", phoneBody: "75", accent: "cyan" },
      { eyebrow: "Reveal", headline: "72 — somebody knew you", detail: "Closest guess scores, but the explanation is usually the best part.", phoneLabel: "CLOSEST", phoneBody: "75", accent: "emerald" },
    ],
  },
  "on-my-list": {
    hook: "One person knows the list. Everyone else tries to get inside their head.",
    payoff: "The reveal gets better as the room realizes the ranking is nothing like what they expected.",
    facts: ["Private ranked list", "Personal prompts", "Guess together", "Built for conversation"],
    steps: [
      { eyebrow: "Build it privately", headline: "Top 5 road-trip snacks", detail: "The List Maker ranks their real answers in secret.", phoneLabel: "#1", phoneBody: "BEEF JERKY", accent: "violet" },
      { eyebrow: "The hunt", headline: "The room starts calling answers", detail: "Chips? Gummies? Sunflower seeds? Every hit exposes another piece of the list.", phoneLabel: "FOUND", phoneBody: "#4 GUMMIES", accent: "cyan" },
      { eyebrow: "Full reveal", headline: "You knew the list… mostly", detail: "The final ranking becomes the argument everyone remembers.", phoneLabel: "LIST COMPLETE", phoneBody: "5 / 5", accent: "emerald" },
    ],
  },
  "inside-man": {
    hook: "Everyone has the same mission. One player secretly wants it to fail.",
    payoff: "The game gives the room just enough information to become suspicious of everybody.",
    facts: ["Hidden role", "Group missions", "Secret sabotage", "Accusation & deduction"],
    steps: [
      { eyebrow: "Private role", headline: "Three Loyal. One Inside Man.", detail: "Your phone tells only you which side you are on.", phoneLabel: "YOUR ROLE", phoneBody: "THE INSIDE MAN", accent: "rose" },
      { eyebrow: "Mission", headline: "Choose two players to secure the drop", detail: "The group debates who should be trusted while the Inside Man tries to look helpful.", phoneLabel: "MISSION TEAM", phoneBody: "TYLER + OLIVIA", accent: "cyan" },
      { eyebrow: "Sabotage", headline: "MISSION FAILED", detail: "Someone on that team betrayed the group. Now every earlier decision looks suspicious.", phoneLabel: "RESULT", phoneBody: "SABOTAGED", accent: "rose" },
      { eyebrow: "The room turns", headline: "Who do you trust now?", detail: "Accusations start immediately—and the Inside Man gets to defend the lie.", phoneLabel: "VOTE", phoneBody: "WHO DID IT?", accent: "amber" },
    ],
  },
  "phone-holdem": {
    hook: "A real poker table without cards, chips, or a dealer.",
    payoff: "Everyone keeps their own private hand while the phones handle dealing, betting, side pots, and the showdown.",
    facts: ["Private hole cards", "Live betting", "Automatic pots", "Tournament-ready"],
    steps: [
      { eyebrow: "Private hand", headline: "Your cards stay on your phone", detail: "Nobody passes a deck and nobody can peek across the table.", phoneLabel: "YOUR HAND", phoneBody: "A♠  K♠", accent: "violet" },
      { eyebrow: "Your action", headline: "Fold · Call · Raise · All-in", detail: "All legal wagering actions stay together while the board remains shared.", phoneLabel: "TO CALL", phoneBody: "120", accent: "cyan" },
      { eyebrow: "Showdown", headline: "CHANNING WINS — FLUSH", detail: "The winning five-card hand is shown with the result so everybody sees exactly why it won.", phoneLabel: "WINNING HAND", phoneBody: "A♠ K♠ 9♠ 6♠ 3♠", accent: "emerald" },
    ],
  },
  "shot-classic": {
    hook: "Keep the disc golf round. Add a fresh challenge to every hole.",
    payoff: "The course stays real, but every tee suddenly has a new reason to think, risk, or celebrate.",
    facts: ["Real round", "Hole challenges", "Tokens & plays", "Disc golf"],
    steps: [
      { eyebrow: "Hole 7", headline: "Challenge: Park the approach", detail: "The app gives the group a clear side objective without replacing normal scoring.", phoneLabel: "CHALLENGE", phoneBody: "INSIDE 20 FT", accent: "cyan" },
      { eyebrow: "Pressure", headline: "Use a Special Play—or save it", detail: "The strategy comes from deciding when the hole is worth spending an advantage.", phoneLabel: "SPECIAL PLAY", phoneBody: "MULLIGAN", accent: "amber" },
      { eyebrow: "Payoff", headline: "Challenge cleared", detail: "The throw mattered twice: once for the round and once for the game layered on top.", phoneLabel: "REWARD", phoneBody: "+2 TOKENS", accent: "emerald" },
    ],
  },
  "shot-chaos": {
    hook: "Shot Caddy Classic with the safety rails removed.",
    payoff: "Chaos creates the kind of swing where one power play can turn an ordinary hole into the story of the round.",
    facts: ["Real round", "Disruptive powers", "Bigger swings", "Disc golf"],
    steps: [
      { eyebrow: "Chaos card", headline: "Your rival just changed the hole", detail: "A power-up adds a temporary rule that everyone has to play around.", phoneLabel: "CHAOS", phoneBody: "ONE-DISC HOLE", accent: "rose" },
      { eyebrow: "Counterplay", headline: "Do you burn your protection now?", detail: "You can answer chaos with your own saved Special Play—or take the risk.", phoneLabel: "AVAILABLE", phoneBody: "INSURANCE", accent: "amber" },
      { eyebrow: "Swing", headline: "The hole flips the standings", detail: "The physical throws still decide it. Chaos just makes the consequences louder.", phoneLabel: "HOLE SWING", phoneBody: "+4", accent: "emerald" },
    ],
  },
  "battle-mode": {
    hook: "Turn a round into a head-to-head fight for momentum.",
    payoff: "Every hole becomes a small contest with tactical choices that can change who has control next.",
    facts: ["Hole battles", "Tokens", "Tactical plays", "Live standings"],
    steps: [
      { eyebrow: "Battle starts", headline: "Closest drive wins the opening edge", detail: "The hole gets one clear contest layered over normal scoring.", phoneLabel: "BATTLE", phoneBody: "CLOSEST TO PIN", accent: "rose" },
      { eyebrow: "Decision", headline: "Spend 2 tokens to double the reward?", detail: "The risk is visible before anyone throws.", phoneLabel: "WAGER", phoneBody: "DOUBLE IT", accent: "amber" },
      { eyebrow: "Momentum", headline: "Olivia takes the battle", detail: "The winner leaves the hole with more than a good score—they gain leverage for what comes next.", phoneLabel: "WINNER", phoneBody: "+4 BATTLE", accent: "emerald" },
    ],
  },
  "call-your-score": {
    hook: "Say what you are going to do before you throw.",
    payoff: "A routine par putt feels different when everybody knows you called birdie two minutes ago.",
    facts: ["Pre-hole prediction", "Disc + ball golf", "Risk/reward", "Simple scoring"],
    steps: [
      { eyebrow: "Before the tee", headline: "Call it: Birdie, Par, or Worse", detail: "Commit before the hole starts.", phoneLabel: "YOUR CALL", phoneBody: "BIRDIE", accent: "cyan" },
      { eyebrow: "Now it matters", headline: "18 feet left for the called birdie", detail: "The prediction turns an ordinary putt into a public promise.", phoneLabel: "STATUS", phoneBody: "FOR BIRDIE", accent: "amber" },
      { eyebrow: "Back it up", headline: "Call confirmed", detail: "Make the prediction real and collect the points.", phoneLabel: "RESULT", phoneBody: "+3", accent: "emerald" },
    ],
  },
  "challenge-skins-pro": {
    hook: "One focused skill contest on every hole. One winner.",
    payoff: "It keeps the round moving while giving every hole a second scoreboard to care about.",
    facts: ["One challenge per hole", "Disc + ball golf", "Skin winner", "Tournament-friendly"],
    steps: [
      { eyebrow: "Hole challenge", headline: "Best drive inside the fairway", detail: "Everybody gets the same objective.", phoneLabel: "SKIN", phoneBody: "FAIRWAY DRIVE", accent: "cyan" },
      { eyebrow: "Result", headline: "Two qualify. One is closer.", detail: "The app resolves the challenge while normal hole scoring continues.", phoneLabel: "LEADER", phoneBody: "TYLER", accent: "amber" },
      { eyebrow: "Skin awarded", headline: "Tyler takes Hole 5", detail: "One clean payoff, then the group moves on.", phoneLabel: "SKINS", phoneBody: "TYLER 3", accent: "emerald" },
    ],
  },
  "wolf": {
    hook: "Every hole asks the leader: partner up or go alone?", payoff: "The best moments happen when somebody rejects the safe partner and calls Lone Wolf.", facts: ["Rotating Wolf", "Partner choices", "Lone Wolf", "Disc + ball golf"],
    steps: [
      { eyebrow: "You are the Wolf", headline: "Watch the first drive", detail: "After each player throws, decide whether to take that partner or keep waiting.", phoneLabel: "WOLF", phoneBody: "CHANNING", accent: "violet" },
      { eyebrow: "Decision", headline: "Take Tyler—or hunt alone?", detail: "Passing on a strong drive can create a bigger payoff but more risk.", phoneLabel: "CHOICE", phoneBody: "LONE WOLF", accent: "amber" },
      { eyebrow: "Hole result", headline: "Lone Wolf survives", detail: "One brave decision changes the point swing for the whole card.", phoneLabel: "AWARD", phoneBody: "+4", accent: "emerald" },
    ],
  },
  "redemption-wolf": {
    hook: "Wolf, but the trailing player keeps getting a way back into the fight.", payoff: "Being behind creates pressure and opportunity instead of making the rest of the round feel decided.", facts: ["Wolf strategy", "Comeback pressure", "3–6 players", "Disc + ball golf"],
    steps: [
      { eyebrow: "Trailing player", headline: "You get the next opening", detail: "Redemption shifts the strategic initiative toward the player who needs it most.", phoneLabel: "REDEMPTION", phoneBody: "YOUR TURN", accent: "rose" },
      { eyebrow: "Big choice", headline: "Partner up or chase the swing?", detail: "A comeback opportunity still requires a real golf decision.", phoneLabel: "RISK", phoneBody: "GO ALONE", accent: "amber" },
      { eyebrow: "Back in it", headline: "The gap just closed", detail: "The round gets tighter without handing anyone free points.", phoneLabel: "STANDINGS", phoneBody: "-1 BACK", accent: "emerald" },
    ],
  },
  "wolf-pack": {
    hook: "Build the only team on the card—or decide the pack is better hunted alone.", payoff: "Every selection changes alliances in public, which makes the next throw immediately personal.", facts: ["Dynamic teams", "3–6 players", "Solo option", "Disc + ball golf"],
    steps: [
      { eyebrow: "Pack forming", headline: "Pick one player after each drive", detail: "The team grows in real time as throws come in.", phoneLabel: "PACK", phoneBody: "OLIVIA + TYLER", accent: "violet" },
      { eyebrow: "The holdout", headline: "One player stays outside", detail: "That player can still beat the whole pack with the right hole.", phoneLabel: "HUNTER", phoneBody: "CHANNING", accent: "amber" },
      { eyebrow: "Showdown", headline: "Hunter takes the hole", detail: "The alliance you built just became the team that lost together.", phoneLabel: "RESULT", phoneBody: "HUNTER +3", accent: "emerald" },
    ],
  },
  "card-shark-classic": {
    hook: "Make shots. Earn cards. Build the best poker hand.", payoff: "A putt can improve your hand, steal the lead, or complete the exact card you needed.", facts: ["One basket", "Earn cards", "Poker hands", "Backyard-friendly"],
    steps: [
      { eyebrow: "Make the attempt", headline: "Hit the station, earn a card", detail: "Physical success immediately becomes poker value.", phoneLabel: "CARD EARNED", phoneBody: "K♣", accent: "cyan" },
      { eyebrow: "Hand grows", headline: "Pair of Kings", detail: "Everybody can see the race without seeing every future card.", phoneLabel: "YOUR HAND", phoneBody: "K♣ K♦ 8♠ 4♥ 2♣", accent: "amber" },
      { eyebrow: "Hand won", headline: "Kings hold up", detail: "Win the poker hand, then race to be first to three.", phoneLabel: "MATCH", phoneBody: "1–0", accent: "emerald" },
    ],
  },
  "card-shark-stud": {
    hook: "Earn your hand one live card at a time.", payoff: "Stud makes every new card public pressure because the hand keeps revealing itself as the physical game continues.", facts: ["Stud poker", "Earn cards", "One basket", "Visible progression"],
    steps: [
      { eyebrow: "First card", headline: "A make earns the 9♠", detail: "Your hand starts forming from real attempts.", phoneLabel: "UP CARD", phoneBody: "9♠", accent: "cyan" },
      { eyebrow: "Fourth card", headline: "Now everyone sees the threat", detail: "Three spades showing changes what the table thinks you might be building.", phoneLabel: "SHOWING", phoneBody: "9♠ J♠ 4♦ Q♠", accent: "amber" },
      { eyebrow: "Final card", headline: "Flush completed", detail: "The last make turns visible possibility into the winning hand.", phoneLabel: "HAND", phoneBody: "FLUSH", accent: "emerald" },
    ],
  },
  "card-shark-draw": {
    hook: "Earn the hand, then decide what is worth throwing away.", payoff: "The physical game creates the cards, but the draw decision creates the poker tension.", facts: ["Draw poker", "Replacement decision", "One basket", "Earn cards"],
    steps: [
      { eyebrow: "Initial hand", headline: "Pair of 8s", detail: "Your live attempts built five cards. Now you choose what to keep.", phoneLabel: "HAND", phoneBody: "8♠ 8♦ K♣ 5♥ 2♣", accent: "cyan" },
      { eyebrow: "Draw", headline: "Discard three", detail: "Keep the pair and earn replacements through the next attempts.", phoneLabel: "KEEP", phoneBody: "8♠ 8♦", accent: "amber" },
      { eyebrow: "Payoff", headline: "Three of a kind", detail: "The draw decision worked—and everybody knows exactly when the hand changed.", phoneLabel: "FINAL", phoneBody: "8♠ 8♦ 8♥", accent: "emerald" },
    ],
  },
  "atw-ladder": {
    hook: "Move station by station around one basket.", payoff: "The whole game is visible in front of you: one more make means one more step toward finishing the ladder.", facts: ["One basket", "Station ladder", "Families & groups", "Fast setup"],
    steps: [
      { eyebrow: "Station 1", headline: "Make it to advance", detail: "Every player starts on the same ladder.", phoneLabel: "CURRENT", phoneBody: "10 FT", accent: "cyan" },
      { eyebrow: "Climb", headline: "Olivia reaches Station 5", detail: "Miss and you stay. Make and you keep moving.", phoneLabel: "PROGRESS", phoneBody: "5 / 7", accent: "amber" },
      { eyebrow: "Finish", headline: "Ladder cleared", detail: "First player through every station wins.", phoneLabel: "WINNER", phoneBody: "OLIVIA", accent: "emerald" },
    ],
  },
  "atw-sprint": {
    hook: "Around The World with the pace turned up.", payoff: "Nobody has time to settle in—the race is short enough that one miss can immediately matter.", facts: ["One basket", "Fast stations", "Quick matches", "Group race"],
    steps: [
      { eyebrow: "Sprint start", headline: "Three stations. Go.", detail: "A condensed course makes every attempt matter immediately.", phoneLabel: "SPRINT", phoneBody: "1 / 3", accent: "cyan" },
      { eyebrow: "Neck and neck", headline: "Two players reach the final station", detail: "The whole match is down to the next make.", phoneLabel: "FINAL", phoneBody: "15 FT", accent: "amber" },
      { eyebrow: "Finish", headline: "Tyler wins by one throw", detail: "Short format. Clean payoff. Run it back.", phoneLabel: "TIME", phoneBody: "2:18", accent: "emerald" },
    ],
  },
  "atw-survival": {
    hook: "Around The World where misses start costing lives.", payoff: "A simple station game becomes tense as the field gets smaller and every miss feels louder.", facts: ["One basket", "Lives", "Elimination pressure", "Group play"],
    steps: [
      { eyebrow: "Everyone alive", headline: "3 lives each", detail: "Advance through the stations while protecting your lives.", phoneLabel: "LIVES", phoneBody: "● ● ●", accent: "cyan" },
      { eyebrow: "Pressure", headline: "Miss — lose a life", detail: "The same putt means more when it can push you toward elimination.", phoneLabel: "LIVES", phoneBody: "● ○ ○", accent: "rose" },
      { eyebrow: "Last player standing", headline: "Survival winner", detail: "The final make ends the match with one player still alive.", phoneLabel: "WINNER", phoneBody: "CHANNING", accent: "emerald" },
    ],
  },
  "disc-warrior": {
    hook: "Six throws. Rising values. One Game Master making the ladder unpredictable.", payoff: "You decide whether to bank a safe number or chase the high-value throw while modifiers can change the stakes in real time.", facts: ["Six throws", "Value ladder", "Game Master", "Single basket"],
    steps: [
      { eyebrow: "Throw 3 of 6", headline: "This station is worth 300", detail: "Each successful throw climbs the value ladder.", phoneLabel: "VALUE", phoneBody: "300", accent: "cyan" },
      { eyebrow: "Modifier reveal", headline: "DOUBLE OR NOTHING", detail: "The Game Master can transform the next attempt before the throw happens.", phoneLabel: "MODIFIER", phoneBody: "2×", accent: "amber" },
      { eyebrow: "Champion", headline: "1,450 takes it", detail: "Six throws produce one clean final score and one winner.", phoneLabel: "FINAL", phoneBody: "1,450", accent: "emerald" },
    ],
  },
  "quest-digital": {
    hook: "A fantasy campaign that remembers what your Hero actually did.", payoff: "Choices, relationships, danger, and discoveries become part of a persistent Chronicle instead of resetting after every session.", facts: ["No course required", "Persistent Hero", "Choices + 2d6", "Living Chronicle"],
    steps: [
      { eyebrow: "Your Chronicle", headline: "The Lantern cut should not be glowing", detail: "The story remembers prior discoveries and changes what becomes possible next.", phoneLabel: "SCENE", phoneBody: "THE ANSWERING FRACTURE", accent: "violet" },
      { eyebrow: "Danger", headline: "The Fracture Stalker charges", detail: "Choose how your Hero responds, then roll only when the outcome is genuinely uncertain.", phoneLabel: "HEALTH", phoneBody: "6 / 6", accent: "rose" },
      { eyebrow: "Consequence", headline: "Success—with a cost", detail: "You stop the charge, lose 1 Health, and learn something the Chronicle will remember.", phoneLabel: "HEALTH", phoneBody: "5 / 6", accent: "amber" },
      { eyebrow: "Becoming", headline: "Your story changes you", detail: "Talents, relationships, Calling, and future scenes emerge from the pattern of what you actually do.", phoneLabel: "CHRONICLE", phoneBody: "UPDATED", accent: "emerald" },
    ],
  },
  "quest-disc-golf": {
    hook: "Your real disc-golf round becomes the engine of a fantasy adventure.", payoff: "A drive is still a drive—but now the result can open a path, trigger danger, or change what your Hero carries into the next chapter.", facts: ["Real throws", "Persistent Hero", "Fantasy layer", "Disc golf"],
    steps: [
      { eyebrow: "Hole begins", headline: "The ruined gate is sealed", detail: "The fantasy challenge is tied to what happens on the real hole.", phoneLabel: "QUEST", phoneBody: "BREAK THE SEAL", accent: "violet" },
      { eyebrow: "Real throw", headline: "Park the drive to create an opening", detail: "The physical result determines the fiction instead of an arbitrary button press.", phoneLabel: "THROW RESULT", phoneBody: "PARKED", accent: "cyan" },
      { eyebrow: "Story moves", headline: "The gate opens", detail: "Your round created a story consequence that stays in the Chronicle.", phoneLabel: "CHRONICLE", phoneBody: "+ NEW PATH", accent: "emerald" },
    ],
  },
  "last-call": {
    hook: "A murder mystery where every phone knows something the room does not.", payoff: "People do not just collect clues—they build a case, challenge alibis, and discover whether their theory can actually convict the killer.", facts: ["4–8 players", "Private evidence", "Interrogation", "Build Your Case"],
    steps: [
      { eyebrow: "Private clue", headline: "Your timeline does not match theirs", detail: "Only you see the contradiction, so you decide when to expose it.", phoneLabel: "PRIVATE EVIDENCE", phoneBody: "11:42 PM", accent: "violet" },
      { eyebrow: "The room reacts", headline: "Someone's alibi just broke", detail: "Face-to-face interrogation becomes the real game.", phoneLabel: "ROUND 3", phoneBody: "BREAK THE ALIBIS", accent: "amber" },
      { eyebrow: "Build Your Case", headline: "Suspect + motive + place + proof", detail: "Your accusation is only as strong as the evidence you connect to it.", phoneLabel: "CASE SCORE", phoneBody: "10 / 12", accent: "cyan" },
      { eyebrow: "Truth reveal", headline: "The murderer is exposed", detail: "The whole room gets the same synchronized finale and sees whether the case held up.", phoneLabel: "VERDICT", phoneBody: "CONVICTED", accent: "emerald" },
    ],
  },
  "play-point-trivia": {
    hook: "A hosted trivia night where every phone is an answer sheet and the room shares the scoreboard.", payoff: "The host controls the pace while teams answer privately, wager strategically, and react together to every reveal.", facts: ["Hosted rooms", "Teams", "Wagers", "Live scoreboard"],
    steps: [
      { eyebrow: "Question", headline: "Which planet has the shortest day?", detail: "Every team answers privately on its own phone.", phoneLabel: "LOCKED IN", phoneBody: "JUPITER", accent: "cyan" },
      { eyebrow: "Reveal", headline: "Correct — Jupiter", detail: "The answer lands for the whole room at once.", phoneLabel: "POINTS", phoneBody: "+200", accent: "emerald" },
      { eyebrow: "Final wager", headline: "Risk 600 to take the lead?", detail: "The last decision can change the whole scoreboard.", phoneLabel: "WAGER", phoneBody: "600", accent: "amber" },
    ],
  },
};

export function getGameExperienceDemo(game: MasterGameEntry): GameExperienceDemo {
  return demos[game.id] ?? {
    hook: game.description,
    payoff: "See how the game creates a shared moment before you decide to start it.",
    facts: [game.family, game.lane, game.status === "live" ? "Finished" : "Playable preview"],
    steps: [
      { eyebrow: "Set the moment", headline: game.title, detail: game.description, phoneLabel: "READY", phoneBody: "START", accent: "cyan" },
      { eyebrow: "Play", headline: "The group makes the decisions", detail: "The phone handles the private information and game state while people stay focused on each other.", phoneLabel: "LIVE", phoneBody: "IN PLAY", accent: "amber" },
      { eyebrow: "Payoff", headline: "A result everyone reacts to", detail: "The digital layer creates a clear shared reveal without replacing the real interaction.", phoneLabel: "RESULT", phoneBody: "REVEALED", accent: "emerald" },
    ],
  };
}
