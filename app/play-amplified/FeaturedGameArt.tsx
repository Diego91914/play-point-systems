export type FeaturedGameArtId = "shot-classic" | "clear-the-stack" | "phone-holdem" | "live-craps" | "quest-digital";

const common = "h-full w-full text-white/55";

export function FeaturedGameArt({ gameId }: { gameId: FeaturedGameArtId }) {
  if (gameId === "shot-classic") {
    return (
      <svg aria-hidden="true" viewBox="0 0 320 180" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M24 132c46-35 90-45 139-30 45 14 84 14 133-12" opacity=".28" />
        <ellipse cx="77" cy="61" rx="45" ry="13" transform="rotate(-12 77 61)" />
        <path d="M37 69c33 13 64 13 92-2" />
        <path d="M225 35v104M199 63h52M205 76h40M211 89h28M217 102h16" />
        <path d="M189 139h72M200 151h50" />
        <path d="M114 58c42-7 76-2 105 17" strokeDasharray="7 8" opacity=".52" />
        <circle cx="225" cy="35" r="4" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (gameId === "clear-the-stack") {
    return (
      <svg aria-hidden="true" viewBox="0 0 320 180" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M54 133h98M64 120h78M74 107h58M84 94h38" opacity=".8" />
        <ellipse cx="103" cy="82" rx="42" ry="10" />
        <ellipse cx="103" cy="66" rx="35" ry="8" />
        <ellipse cx="103" cy="52" rx="28" ry="7" />
        <path d="M211 33v105M185 61h52M191 75h40M197 89h28M203 103h16" />
        <path d="M178 138h66M189 150h44" />
        <path d="M143 71c32-10 54-9 68 2" strokeDasharray="7 8" opacity=".52" />
        <circle cx="211" cy="33" r="4" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (gameId === "phone-holdem") {
    return (
      <svg aria-hidden="true" viewBox="0 0 320 180" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="54" y="36" width="64" height="94" rx="12" transform="rotate(-9 54 36)" />
        <rect x="112" y="31" width="64" height="94" rx="12" transform="rotate(4 112 31)" />
        <path d="M142 55c5-9 18-4 16 6-2 7-16 18-16 18s-14-11-16-18c-2-10 11-15 16-6Z" fill="currentColor" stroke="none" opacity=".55" />
        <circle cx="231" cy="90" r="38" />
        <circle cx="231" cy="90" r="25" strokeDasharray="6 7" opacity=".6" />
        <path d="M220 81h22M220 90h22M220 99h22" />
        <circle cx="86" cy="55" r="4" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (gameId === "live-craps") {
    return (
      <svg aria-hidden="true" viewBox="0 0 320 180" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="55" y="42" width="76" height="76" rx="14" transform="rotate(-8 55 42)" />
        <rect x="157" y="47" width="76" height="76" rx="14" transform="rotate(9 157 47)" />
        {[0,1,2].map((row) => [0,1,2].map((col) => <circle key={`l-${row}-${col}`} cx={78 + col * 18} cy={63 + row * 18} r="4" fill="currentColor" stroke="none" opacity={(row + col) % 2 === 0 ? 0.9 : 0.28} />))}
        <circle cx="181" cy="68" r="4" fill="currentColor" stroke="none" />
        <circle cx="212" cy="97" r="4" fill="currentColor" stroke="none" />
        <path d="M43 139h229M62 151h190" opacity=".4" />
        <path d="M250 47c17 13 26 30 28 50" strokeDasharray="7 8" opacity=".55" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 320 180" className={common} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M160 23 211 48v43c0 33-19 55-51 72-32-17-51-39-51-72V48l51-25Z" />
      <path d="m160 53 11 24 26 4-19 18 5 26-23-13-23 13 5-26-19-18 26-4 11-24Z" />
      <path d="M41 129c26-31 50-46 74-47M205 82c27 4 52 20 74 48" strokeDasharray="7 8" opacity=".45" />
      <circle cx="46" cy="127" r="6" />
      <circle cx="274" cy="129" r="6" />
      <path d="M160 23v28M109 48l29 35M211 48l-29 35" opacity=".4" />
    </svg>
  );
}
