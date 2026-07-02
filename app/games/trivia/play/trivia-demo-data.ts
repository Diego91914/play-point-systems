export type DemoChoiceSlot = "A" | "B" | "C" | "D";

export type DemoResponse = DemoChoiceSlot | "skip";

export type DemoScoring = {
  correct: number;
  wrong: number;
  skip: number;
};

export type DemoChoice = {
  slot: DemoChoiceSlot;
  text: string;
  isCorrect: boolean;
};

export type DemoQuestion = {
  sourceId: string;
  prompt: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  reference: string;
  explanation: string;
  choices: readonly DemoChoice[];
};

export type DemoRound = {
  slug: string;
  label: string;
  intro: string;
  scoring: DemoScoring;
  questions: readonly DemoQuestion[];
};

export type DemoCard = DemoQuestion & {
  roundSlug: string;
  roundLabel: string;
  roundIntro: string;
  roundIndex: number;
  questionNumberInRound: number;
  totalQuestionsInRound: number;
  totalRounds: number;
  totalQuestions: number;
  scoring: DemoScoring;
};

export const DEMO_ROUNDS: readonly DemoRound[] = [
  {
    slug: "hook-round",
    label: "Hook Round",
    intro: "Fast questions teach the room the 10-second countdown before the bigger swings later on.",
    scoring: {
      correct: 1000,
      wrong: 0,
      skip: 0,
    },
    questions: [
      {
        sourceId: "BIB-E-000001",
        difficulty: "easy",
        prompt: "Who built the ark before the flood?",
        reference: "Genesis 6:14",
        explanation: "In Genesis, Noah builds the ark at God's command to survive the flood.",
        choices: [
          { slot: "A", text: "Moses", isCorrect: false },
          { slot: "B", text: "Noah", isCorrect: true },
          { slot: "C", text: "Abraham", isCorrect: false },
          { slot: "D", text: "David", isCorrect: false },
        ],
      },
      {
        sourceId: "BIB-E-000004",
        difficulty: "easy",
        prompt: "In what garden did Adam and Eve live?",
        reference: "Genesis 2:8",
        explanation: "Genesis places Adam and Eve in the Garden of Eden before the fall.",
        choices: [
          { slot: "A", text: "Garden of Gethsemane", isCorrect: false },
          { slot: "B", text: "Garden of Eden", isCorrect: true },
          { slot: "C", text: "King's Garden", isCorrect: false },
          { slot: "D", text: "Garden of Carmel", isCorrect: false },
        ],
      },
      {
        sourceId: "BIB-E-000002",
        difficulty: "easy",
        prompt: "Which giant did David defeat with a sling?",
        reference: "1 Samuel 17:49-50",
        explanation: "David defeated Goliath with a sling and a stone before using Goliath's own sword.",
        choices: [
          { slot: "A", text: "Goliath", isCorrect: true },
          { slot: "B", text: "Saul", isCorrect: false },
          { slot: "C", text: "Samson", isCorrect: false },
          { slot: "D", text: "Absalom", isCorrect: false },
        ],
      },
    ],
  },
  {
    slug: "pressure-board",
    label: "Pressure Board",
    intro: "The room knows the rhythm now, so every second becomes part of the strategy.",
    scoring: {
      correct: 1000,
      wrong: 0,
      skip: 0,
    },
    questions: [
      {
        sourceId: "BIB-M-000002",
        difficulty: "medium",
        prompt: "Who was swallowed by a great fish after fleeing God's command?",
        reference: "Jonah 1:17",
        explanation: "Jonah was swallowed by a great fish after trying to run from the mission God gave him.",
        choices: [
          { slot: "A", text: "Elijah", isCorrect: false },
          { slot: "B", text: "Jonah", isCorrect: true },
          { slot: "C", text: "Isaiah", isCorrect: false },
          { slot: "D", text: "Jeremiah", isCorrect: false },
        ],
      },
      {
        sourceId: "BIB-M-000003",
        difficulty: "medium",
        prompt: "At Cana, what did Jesus turn into wine?",
        reference: "John 2:7-9",
        explanation: "At the wedding in Cana, Jesus turned water into wine.",
        choices: [
          { slot: "A", text: "Milk", isCorrect: false },
          { slot: "B", text: "Oil", isCorrect: false },
          { slot: "C", text: "Water", isCorrect: true },
          { slot: "D", text: "Honey", isCorrect: false },
        ],
      },
      {
        sourceId: "BIB-M-000011",
        difficulty: "medium",
        prompt: "What city's walls fell after the Israelites marched around it?",
        reference: "Joshua 6:20",
        explanation: "Jericho's walls fell after Israel marched around the city as God instructed.",
        choices: [
          { slot: "A", text: "Jericho", isCorrect: true },
          { slot: "B", text: "Ai", isCorrect: false },
          { slot: "C", text: "Hebron", isCorrect: false },
          { slot: "D", text: "Samaria", isCorrect: false },
        ],
      },
    ],
  },
  {
    slug: "spotlight-sprint",
    label: "Spotlight Sprint",
    intro: "The scoreboard can swing fast when players answer early and protect more of the available points.",
    scoring: {
      correct: 1000,
      wrong: 0,
      skip: 0,
    },
    questions: [
      {
        sourceId: "BIB-H-000001",
        difficulty: "hard",
        prompt: "On what road did Saul encounter the risen Jesus before becoming Paul?",
        reference: "Acts 9:3-6",
        explanation: "Saul encountered the risen Jesus on the road to Damascus before his conversion.",
        choices: [
          { slot: "A", text: "Jericho road", isCorrect: false },
          { slot: "B", text: "Emmaus road", isCorrect: false },
          { slot: "C", text: "Damascus road", isCorrect: true },
          { slot: "D", text: "Via Dolorosa", isCorrect: false },
        ],
      },
      {
        sourceId: "BIB-H-000002",
        difficulty: "hard",
        prompt: "Which judge led Israel with a reduced army of 300 men?",
        reference: "Judges 7:7",
        explanation: "Gideon's army was reduced to 300 so the victory would clearly point back to God.",
        choices: [
          { slot: "A", text: "Samson", isCorrect: false },
          { slot: "B", text: "Gideon", isCorrect: true },
          { slot: "C", text: "Jephthah", isCorrect: false },
          { slot: "D", text: "Ehud", isCorrect: false },
        ],
      },
      {
        sourceId: "BIB-M-000012",
        difficulty: "medium",
        prompt: "What trade did Paul practice to support himself?",
        reference: "Acts 18:3",
        explanation: "Acts records that Paul worked as a tentmaker while traveling and teaching.",
        choices: [
          { slot: "A", text: "Carpenter", isCorrect: false },
          { slot: "B", text: "Fisherman", isCorrect: false },
          { slot: "C", text: "Tentmaker", isCorrect: true },
          { slot: "D", text: "Scribe", isCorrect: false },
        ],
      },
    ],
  },
  {
    slug: "final-word",
    label: "Final Word",
    intro: "The last round uses the same 10-second clock, so every second still matters.",
    scoring: {
      correct: 1000,
      wrong: 0,
      skip: 0,
    },
    questions: [
      {
        sourceId: "BIB-X-000001",
        difficulty: "expert",
        prompt: "Which king saw the writing on the wall at a great feast?",
        reference: "Daniel 5:1-6",
        explanation: "Daniel 5 records that Belshazzar saw the writing on the wall during a great feast.",
        choices: [
          { slot: "A", text: "Nebuchadnezzar", isCorrect: false },
          { slot: "B", text: "Belshazzar", isCorrect: true },
          { slot: "C", text: "Darius", isCorrect: false },
          { slot: "D", text: "Cyrus", isCorrect: false },
        ],
      },
      {
        sourceId: "BIB-X-000006",
        difficulty: "expert",
        prompt: "In what city were the disciples first called Christians?",
        reference: "Acts 11:26",
        explanation: "Acts says the disciples were first called Christians in Antioch.",
        choices: [
          { slot: "A", text: "Jerusalem", isCorrect: false },
          { slot: "B", text: "Rome", isCorrect: false },
          { slot: "C", text: "Antioch", isCorrect: true },
          { slot: "D", text: "Ephesus", isCorrect: false },
        ],
      },
      {
        sourceId: "BIB-X-000008",
        difficulty: "expert",
        prompt: "From which tribe of Israel did Paul say he came?",
        reference: "Philippians 3:5",
        explanation: "In Philippians, Paul identifies himself as being from the tribe of Benjamin.",
        choices: [
          { slot: "A", text: "Judah", isCorrect: false },
          { slot: "B", text: "Levi", isCorrect: false },
          { slot: "C", text: "Benjamin", isCorrect: true },
          { slot: "D", text: "Ephraim", isCorrect: false },
        ],
      },
    ],
  },
];

export const DEMO_CARDS: readonly DemoCard[] = DEMO_ROUNDS.flatMap((round, roundIndex) =>
  round.questions.map((question, questionIndex) => ({
    ...question,
    roundSlug: round.slug,
    roundLabel: round.label,
    roundIntro: round.intro,
    roundIndex: roundIndex + 1,
    questionNumberInRound: questionIndex + 1,
    totalQuestionsInRound: round.questions.length,
    totalRounds: DEMO_ROUNDS.length,
    totalQuestions: DEMO_ROUNDS.reduce((total, currentRound) => total + currentRound.questions.length, 0),
    scoring: round.scoring,
  })),
);

export const DEMO_CATEGORY = "Bible Gold";

export const DEMO_PACK_NAME = "Bible Gold Launch Demo";
