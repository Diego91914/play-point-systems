export const GET_THERE_RULES = {
  title: "GET THERE",
  tagline: "Start the conversation. Hide the destination.",
  roundsPerPlayer: 3,
  scoring: {
    primary: "Most destinations reached",
    tiebreaker: "Fewest total steps on successful destinations",
  },
  answerFlow: {
    order: "clockwise",
    rule: "Ask one question. Players answer in clockwise order, one at a time. After each answer, the Navigator must USE it or PASS it.",
    use: "USE locks that answer as the next link. The Navigator asks a new question built from that answer, beginning with the next player clockwise.",
    pass: "PASS permanently sacrifices that answer for the current question and allows the next player clockwise to answer the same question.",
    oneAnswerPerPlayerPerQuestion: true,
  },
  navigator: {
    maySayDestination: false,
    maySpellDestination: false,
    mayGiveFirstLetter: false,
    mayUseRhymingClue: false,
    mayUseSoundsLikeClue: false,
    mayGiveDirectDefinition: false,
  },
} as const;
