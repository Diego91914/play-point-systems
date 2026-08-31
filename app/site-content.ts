export const siteLinks = {
  houseWithTheLightsOn: "https://distrokid.com/hyperfollow/channingstovall/house-with-the-lights-on?ref=release",
  runBackHome: "https://open.spotify.com/album/6eliw7N7GZgPygV8ahLwxc",
  nothingCanSeparate: "https://distrokid.com/hyperfollow/channingstovall/nothing-can-separate?ref=release",
  spotify: "https://open.spotify.com/album/6eliw7N7GZgPygV8ahLwxc",
  appleMusic: "https://music.apple.com/us/artist/channing-stovall/1886380599",
  amazonMusic: "https://music.amazon.com/artists/B0GT55BDC6/channing-stovall",
  youtube: "https://www.youtube.com/results?search_query=channing+stovall",
  website: "https://playpointsystems.com",
  playAmplified: "https://playamplified.com",
};

export const founder = {
  name: "Channing Stovall",
  company: "Play Point Systems, LLC",
  title: "Founder, Creator, and Builder",
  contactTitle: "Founder & Creator",
  email: "channing@playpointsystems.com",
  phone: "(256) 649-PLAY",
  phoneHref: "2566497529",
  websiteLabel: "playpointsystems.com",
};

export const hero = {
  headline: "Games, experiences, and music built to bring people together.",
  subheadline: "Interactive products and faith-rooted music made for experiences people want to return to.",
  intro:
    "Explore Play Amplified for phone-powered games that create more interaction between people already together, or hear the latest Play Point Records release.",
};

export const divisions = [
  {
    name: "Play Amplified",
    eyebrow: "Consumer games and shared play",
    description:
      "Phone-powered games that create more interaction between people already together — whether starting a shared game or adding a new layer to a real-world round or activity.",
    points: [
      "Phones in the game. People in the moment.",
      "Social, cards, trivia, course, backyard, adventure, and scoring",
      "Master consumer home at PlayAmplified.com",
    ],
    href: siteLinks.playAmplified,
    cta: "Explore Play Amplified",
  },
  {
    name: "Play Point Records",
    eyebrow: "Original music",
    description:
      "Country and Christian storytelling through real songs, artist development, and faith-rooted releases that carry their own voice under the Play Point Systems umbrella.",
    points: ["Three songs available now", "Country and Christian storytelling", "New music built around truth and testimony"],
    href: "/music",
    cta: "Listen to Music",
  },
] as const;

export const principles = [
  {
    title: "Purpose First",
    body: "Everything we create should mean something before it tries to impress anyone.",
  },
  {
    title: "Simple Wins",
    body: "If people cannot understand it quickly, it needs to get clearer, not louder.",
  },
  {
    title: "Real Experience Matters",
    body: "We build for actual use, actual emotion, and actual people instead of theory.",
  },
  {
    title: "Faith Over Hype",
    body: "Conviction matters more than trends. We would rather build something honest than something loud.",
  },
  {
    title: "Earn Attention",
    body: "Nothing should feel forced. If the work is real, people will feel it on their own.",
  },
] as const;

export const artist = {
  name: "Channing Stovall",
  currentRelease: "House With The Lights On",
  currentReleaseStatus: "Latest release",
  currentReleaseDate: "May 8, 2026",
  previousRelease: "Run Back Home",
  previousReleaseStatus: "Earlier in current rollout",
  catalogCount: 3,
  project: "Album in progress",
  currentReleaseType: "Latest single | Available now",
  previousReleaseType: "Recent single | Out now",
  albumArc:
    "These first three songs now frame the opening movement of a larger story: first the truth that grace still reaches you, then the decision to turn around, and now the picture of a place still lit up and waiting when you come home.",
  shortBio:
    "Country Christian artist blending faith-driven lyrics, real-life storytelling, and modern production tools into songs about grace, conviction, redemption, and truth.",
  about:
    "The current release focus now spans three live songs in an album-in-progress arc: Nothing Can Separate lays the foundation, Run Back Home captures the turn, and House With The Lights On is the newest chapter now leading the page. The catalog is being built to connect first and point listeners back to truth.",
  trackJourney: [
    {
      number: "Track 1",
      title: "Nothing Can Separate",
      summary: "This is where it starts.",
      body:
        "Before anything changes... before you take a step back... you have to understand one thing: nothing you've done has put you too far out of reach. This song is the foundation. The truth everything else is built on.",
    },
    {
      number: "Track 2",
      title: "Run Back Home",
      summary: "This is the moment of decision.",
      body:
        "Once you realize you're not too far gone... you're faced with a choice. Do you stay where you are... or do you turn around? This song is about that moment, when you finally decide to stop running and start heading back.",
    },
    {
      number: "Track 3",
      title: "House With The Lights On",
      summary: "This is the picture of welcome after the turn.",
      body:
        "After the decision to come back, this song turns that return into an image you can see: a house still lit, still open, and still waiting. It carries the emotional landing point of the opening run of songs and gives the page a stronger present-tense center.",
    },
  ],
  albumWrapLines: [
    "This album isn't about having it all figured out.",
    "It's about the journey of coming back...",
    "learning who God is...",
    "and figuring out how to walk with Him every day after.",
  ],
  catalog: [
    {
      title: "House With The Lights On",
      releaseDate: "May 8, 2026",
      status: "Latest release",
      type: "Single",
      href: siteLinks.houseWithTheLightsOn,
      imageSrc: "/images/music/house-with-the-lights-on.webp",
      imageAlt: "House With The Lights On cover art",
      summary: "The newest live release and the clearest current starting point for listeners landing on the page right now.",
    },
    {
      title: "Run Back Home",
      releaseDate: "April 17, 2026",
      status: "Recent release",
      type: "Single",
      href: siteLinks.runBackHome,
      imageSrc: "/images/music/run-back-home.webp",
      imageAlt: "Run Back Home cover art",
      summary: "The second chapter in the rollout and still a key entry point for listeners moving through the catalog.",
    },
    {
      title: "Nothing Can Separate",
      releaseDate: "Out now",
      status: "Catalog release",
      type: "Single",
      href: siteLinks.nothingCanSeparate,
      imageSrc: "/images/music/nothing-can-separate.webp",
      imageAlt: "Nothing Can Separate cover art",
      summary: "The first public release in the current project arc, still live and still part of the active listening path.",
    },
  ],
  bioParagraphs: [
    "Channing Stovall is a country Christian artist and songwriter focused on one mission: telling real stories that point people back to God.",
    "Blending modern tools with traditional storytelling, Channing writes deeply personal lyrics rooted in faith, life experience, and truth. He uses AI as part of his creative process, then refines, restructures, and shapes each track through BandLab and other production tools to build the final sound. The result is music that feels innovative but stays grounded in message first and method second.",
    "His songs live in the space between testimony and storytelling, never forced and never surface-level. The goal is not to make preaching music. The goal is to make real music with a message.",
    "Rooted in country storytelling and driven by a Christian foundation, Channing Stovall is building a catalog that reflects grace, conviction, redemption, and truth one song at a time.",
  ],
};
