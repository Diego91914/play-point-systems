export const siteLinks = {
  shotCaddy: "https://shotcaddy.net",
  runBackHome: "https://open.spotify.com/album/6eliw7N7GZgPygV8ahLwxc",
  nothingCanSeparate: "https://distrokid.com/hyperfollow/channingstovall/nothing-can-separate?ref=release",
  spotify: "https://open.spotify.com/album/6eliw7N7GZgPygV8ahLwxc",
  youtube: "https://www.youtube.com/results?search_query=channing+stovall",
  website: "https://playpointsystems.com",
};

export const founder = {
  name: "Channing Stovall",
  company: "Play Point Systems, LLC",
  title: "Founder, Creator, and Builder",
  contactTitle: "Founder & Creator - Shot Caddy(TM)",
  email: "channing@playpointsystems.com",
  phone: "(256) 649-PLAY",
  phoneHref: "2566497529",
  websiteLabel: "playpointsystems.com",
};

export const hero = {
  headline: "Building meaningful experiences through software, sport, and music.",
  subheadline: "Play Point Systems is the home of Shot Caddy and Play Point Records, created by Channing Stovall.",
  intro:
    "This is a creator-led parent company built to hold distinct brands with clarity. Shot Caddy carries the product lane. Play Point Records carries the music lane. Both are built with the same standard: create something people actually feel.",
};

export const divisions = [
  {
    name: "Shot Caddy",
    eyebrow: "Software Division",
    description:
      "A private sports product in development, built around memorable play experiences and launching under its own public brand when the time is right.",
    points: ["Private product in development", "Built for memorable shared experiences", "Launching under its own public identity"],
    href: "/shot-caddy",
    cta: "Explore Shot Caddy",
  },
  {
    name: "Play Point Records",
    eyebrow: "Music Division",
    description:
      "Country and Christian storytelling through real songs, artist development, and faith-rooted releases that carry their own voice under the Play Point Systems umbrella.",
    points: ["Current and upcoming releases", "Artist-first presentation", "Faith-driven storytelling with modern production"],
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
  currentRelease: "Run Back Home",
  currentReleaseStatus: "Out now",
  currentReleaseDate: "April 17, 2026",
  previousRelease: "Nothing Can Separate",
  previousReleaseStatus: "Earlier release",
  project: "Album in progress",
  currentReleaseType: "Newest single | Out now",
  previousReleaseType: "Previous release | Out now",
  albumArc:
    "These first two songs introduce the opening movement of a larger album story: first the truth that grace still reaches you, then the choice to turn around and come back.",
  shortBio:
    "Country Christian artist blending faith-driven lyrics, real-life storytelling, and modern production tools into songs about grace, conviction, redemption, and truth.",
  about:
    "The current release focus is split across the opening two tracks of an album in progress: Nothing Can Separate lays the foundation, and Run Back Home released on April 17, 2026 as the next turning-point chapter. The catalog is being built to connect first and point listeners back to truth.",
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
  ],
  albumWrapLines: [
    "This album isn't about having it all figured out.",
    "It's about the journey of coming back...",
    "learning who God is...",
    "and figuring out how to walk with Him every day after.",
  ],
  catalog: [
    {
      title: "Run Back Home",
      releaseDate: "April 17, 2026",
      status: "Newest release",
      type: "Single",
      href: siteLinks.runBackHome,
      imageSrc: "/images/music/run-back-home.png",
      imageAlt: "Run Back Home cover art",
      summary: "The newest live release and the clearest current entry point for listeners landing on the page.",
    },
    {
      title: "Nothing Can Separate",
      releaseDate: "Out now",
      status: "Catalog release",
      type: "Single",
      href: siteLinks.nothingCanSeparate,
      imageSrc: "/images/music/nothing-can-separate.png",
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
