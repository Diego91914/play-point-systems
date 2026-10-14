export type PlayCategoryArtKind = "social" | "course" | "backyard" | "adventure" | "trivia";

export function PlayCategoryArt({ kind }: { kind: PlayCategoryArtKind }) {
  const common = "h-24 w-24 text-white/35 transition duration-300 group-hover:scale-105 group-hover:text-white/50";

  if (kind === "social") {
    return (
      <svg aria-hidden="true" viewBox="0 0 96 96" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="17" y="25" width="42" height="48" rx="8" transform="rotate(-9 17 25)" />
        <rect x="38" y="18" width="42" height="48" rx="8" transform="rotate(8 38 18)" />
        <path d="M49 34c4-7 14-3 12 4-1 5-12 12-12 12S38 43 37 38c-2-7 8-11 12-4Z" fill="currentColor" stroke="none" opacity=".55" />
        <circle cx="30" cy="54" r="3" fill="currentColor" stroke="none" />
        <circle cx="67" cy="33" r="3" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (kind === "course") {
    return (
      <svg aria-hidden="true" viewBox="0 0 96 96" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="29" cy="28" rx="21" ry="7" transform="rotate(-15 29 28)" />
        <path d="M10 34c16 6 30 6 45-1" />
        <path d="M62 18v54M50 34h24M53 42h18M56 50h12M59 58h6" />
        <path d="M47 72h30M53 78h18" />
        <circle cx="62" cy="19" r="3" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (kind === "backyard") {
    return (
      <svg aria-hidden="true" viewBox="0 0 96 96" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="48" cy="48" r="30" />
        <circle cx="48" cy="48" r="20" />
        <circle cx="48" cy="48" r="9" />
        <path d="M70 25 52 43" />
        <path d="m68 17 10 1 1 10M76 18l-8 8" />
        <circle cx="48" cy="48" r="3" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (kind === "adventure") {
    return (
      <svg aria-hidden="true" viewBox="0 0 96 96" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M48 13 72 25v21c0 17-10 29-24 37-14-8-24-20-24-37V25l24-12Z" />
        <path d="m48 27 6 13 14 2-10 10 3 14-13-7-13 7 3-14-10-10 14-2 6-13Z" />
        <path d="M48 13v14M24 25l14 17M72 25 58 42" opacity=".45" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 96 96" className={common} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M33 34c1-12 9-19 21-19 13 0 22 8 22 20 0 10-5 15-14 20-7 4-9 7-9 14" />
      <circle cx="53" cy="79" r="4" fill="currentColor" stroke="none" />
      <path d="M20 25h7M16 39h10M21 54h8M70 66h9" opacity=".55" />
      <path d="m27 18 4 4-4 4M78 43l4 4-4 4" />
    </svg>
  );
}
