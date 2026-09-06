export type AllAboutYouRoundType = "pick" | "finish" | "rank" | "who" | "memory";

export type AllAboutYouPrompt = {
  id: string;
  type: AllAboutYouRoundType;
  text: string;
  choices?: string[];
};

export const ALL_ABOUT_YOU_PROMPTS: readonly AllAboutYouPrompt[] = [
  { id: "pick-5000", type: "pick", text: "You get an unexpected $5,000 tomorrow. What are you MOST likely to do with it?", choices: ["Take a trip", "Save or invest it", "Buy something fun", "Treat people I love"] },
  { id: "pick-free-day", type: "pick", text: "A completely free day appears on your calendar. Where do you want to be?", choices: ["Home with no plans", "Outside somewhere", "On a day trip", "With a crowd"] },
  { id: "pick-table", type: "pick", text: "What matters most to you at a great get-together?", choices: ["The food", "The laughs", "The people", "The stories"] },
  { id: "pick-comfort-food", type: "pick", text: "You have had a long day. Which kind of comfort food sounds best?", choices: ["Pizza or takeout", "Something homemade", "Breakfast food", "Dessert first"] },
  { id: "pick-surprise-plan", type: "pick", text: "Someone says, 'I planned the whole day—just come with me.' What is your first reaction?", choices: ["I am in", "Tell me the plan first", "Give me one hint", "Can we stay home?"] },
  { id: "pick-weather", type: "pick", text: "Which weather makes you happiest when you have nowhere you have to be?", choices: ["Bright and sunny", "Cool and crisp", "Rainy and cozy", "Snowy and quiet"] },
  { id: "pick-restaurant", type: "pick", text: "You get to choose dinner for the whole group. What are you MOST likely to pick?", choices: ["A longtime favorite", "Somewhere new", "Whatever is easiest", "Let the group decide"] },
  { id: "pick-photo", type: "pick", text: "At a big celebration, where are you most likely to be?", choices: ["Taking pictures", "Telling stories", "Helping with something", "Right in the middle of the fun"] },
  { id: "pick-extra-hour", type: "pick", text: "You magically get one extra hour today. How do you want to spend it?", choices: ["Sleep", "Get something done", "Do something fun", "Spend it with someone"] },
  { id: "pick-roadtrip-stop", type: "pick", text: "On a road trip, what stop are you most willing to make?", choices: ["Scenic overlook", "Local food place", "Odd roadside attraction", "No stop—keep moving"] },
  { id: "pick-keepsake", type: "pick", text: "Which kind of keepsake are you most likely to hold onto for years?", choices: ["A handwritten note", "A photograph", "A ticket or souvenir", "Something useful with a story"] },
  { id: "pick-celebrate", type: "pick", text: "What is your favorite kind of celebration?", choices: ["Big and lively", "Small and meaningful", "An experience together", "Low-key at home"] },

  { id: "finish-saturday", type: "finish", text: "Finish this sentence privately: My perfect Saturday starts with _____ ." },
  { id: "finish-always", type: "finish", text: "Finish this sentence privately: I can almost always be talked into _____ ." },
  { id: "finish-home", type: "finish", text: "Finish this sentence privately: Home feels most like home when _____ ." },
  { id: "finish-laugh", type: "finish", text: "Finish this sentence privately: I laugh hardest when _____ ." },
  { id: "finish-treat", type: "finish", text: "Finish this sentence privately: If I decide to treat myself, I usually choose _____ ." },
  { id: "finish-reset", type: "finish", text: "Finish this sentence privately: The fastest way to put me in a better mood is _____ ." },
  { id: "finish-childhood", type: "finish", text: "Finish this sentence privately: One thing from childhood I would happily bring back is _____ ." },
  { id: "finish-trip", type: "finish", text: "Finish this sentence privately: A trip is worth taking if it includes _____ ." },
  { id: "finish-proud", type: "finish", text: "Finish this sentence privately: I am quietly proud that I _____ ." },
  { id: "finish-small-joy", type: "finish", text: "Finish this sentence privately: One small thing that makes my day better is _____ ." },
  { id: "finish-known-for", type: "finish", text: "Finish this sentence privately: People who know me well know I will always _____ ." },
  { id: "finish-next-year", type: "finish", text: "Finish this sentence privately: Sometime in the next year, I would really like to _____ ." },

  { id: "rank-getaway", type: "rank", text: "Rank these from MOST like your ideal getaway to LEAST.", choices: ["Beach", "Mountains", "City", "Stay home"] },
  { id: "rank-night", type: "rank", text: "Rank these from MOST like your kind of night to LEAST.", choices: ["Dinner out", "Game night", "Live music", "Quiet night in"] },
  { id: "rank-gift", type: "rank", text: "Rank these gifts from MOST exciting to LEAST.", choices: ["An experience", "Something useful", "Something sentimental", "A surprise"] },
  { id: "rank-weekend", type: "rank", text: "Rank these weekend plans from MOST appealing to LEAST.", choices: ["Go somewhere new", "See friends or family", "Work on a project", "Do absolutely nothing"] },
  { id: "rank-food", type: "rank", text: "Rank these food moods from MOST tempting to LEAST.", choices: ["Comfort food", "Something spicy", "Something fresh", "Dessert"] },
  { id: "rank-vacation", type: "rank", text: "Rank what matters MOST to LEAST on a vacation.", choices: ["Great food", "Great scenery", "Things to do", "Time to relax"] },
  { id: "rank-morning", type: "rank", text: "Rank these morning upgrades from BEST to LEAST important.", choices: ["Extra sleep", "Good coffee or breakfast", "No schedule", "Nice weather"] },
  { id: "rank-party", type: "rank", text: "Rank these parts of a celebration from MOST important to LEAST.", choices: ["The people", "The food", "The atmosphere", "The memories"] },
  { id: "rank-free-time", type: "rank", text: "Rank these ways to spend free time from MOST like you to LEAST.", choices: ["Be outdoors", "Watch or read something", "Make or fix something", "Go see people"] },
  { id: "rank-roadtrip", type: "rank", text: "Rank these road-trip priorities from MOST important to LEAST.", choices: ["Good conversation", "Good music", "Good snacks", "Getting there fast"] },
  { id: "rank-season", type: "rank", text: "Rank the seasons from FAVORITE to LEAST favorite.", choices: ["Spring", "Summer", "Fall", "Winter"] },
  { id: "rank-legacy", type: "rank", text: "Rank what you would MOST want people to remember about you to LEAST.", choices: ["I showed up", "I made people laugh", "I worked hard", "I cared deeply"] },

  { id: "who-stranded", type: "who", text: "If you were stranded somewhere overnight, which person here would you want with you?" },
  { id: "who-roadtrip", type: "who", text: "Which person here would you trust most to keep a long road trip fun?" },
  { id: "who-secret", type: "who", text: "Which person here would you trust first with a ridiculous secret?" },
  { id: "who-rescue", type: "who", text: "If you called at midnight and needed help, which person here would you expect to show up first?" },
  { id: "who-laugh", type: "who", text: "Which person here is most likely to make you laugh when you are trying not to?" },
  { id: "who-plan", type: "who", text: "Which person here would you trust to plan a full day for you without asking any questions?" },
  { id: "who-team", type: "who", text: "If you had to enter a completely random competition tomorrow, which person here would you want on your team?" },
  { id: "who-advice", type: "who", text: "Which person here would you call first if you needed a second opinion on a big decision?" },
  { id: "who-surprise", type: "who", text: "Which person here would be best at planning a surprise you would actually enjoy?" },
  { id: "who-lost", type: "who", text: "If the whole group got lost, which person here would you most trust to get everyone back on track?" },
  { id: "who-story", type: "who", text: "Which person here could probably tell the funniest true story about you?" },
  { id: "who-day", type: "who", text: "If you could spend an unplanned day with just one person here, who would you pick?" },

  { id: "memory-laugh", type: "memory", text: "Share one memory with the Guest of Honor that still makes you laugh." },
  { id: "memory-meaning", type: "memory", text: "Share a moment with the Guest of Honor that meant more to you than they may realize." },
  { id: "memory-only-us", type: "memory", text: "Share a memory that could only belong to you and the Guest of Honor." },
  { id: "memory-first", type: "memory", text: "Share one of the first memories you have of the Guest of Honor." },
  { id: "memory-proud", type: "memory", text: "Share a moment when the Guest of Honor made you proud." },
  { id: "memory-kindness", type: "memory", text: "Share a time the Guest of Honor did something kind that stuck with you." },
  { id: "memory-chaos", type: "memory", text: "Share a memory with the Guest of Honor where everything went a little off the rails." },
  { id: "memory-tradition", type: "memory", text: "Share a tradition, routine, or little thing you associate with the Guest of Honor." },
  { id: "memory-trip", type: "memory", text: "Share a favorite memory of going somewhere or doing something with the Guest of Honor." },
  { id: "memory-ordinary", type: "memory", text: "Share an ordinary moment with the Guest of Honor that became a great memory anyway." },
  { id: "memory-quote", type: "memory", text: "Share something the Guest of Honor once said or did that you still remember clearly." },
  { id: "memory-grateful", type: "memory", text: "Share one memory that makes you especially grateful the Guest of Honor is part of your life." },
] as const;

export const ALL_ABOUT_YOU_ROUND_ORDER: readonly AllAboutYouRoundType[] = ["pick", "finish", "rank", "who", "memory"];
