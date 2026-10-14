export type FeaturedGameArtId = "shot-classic" | "clear-the-stack" | "phone-holdem" | "live-craps" | "quest-digital";

const common = "h-full w-full text-white/60";

function Phone({ x, y, rotate = 0, scale = 1 }: { x: number; y: number; rotate?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <rect x="-18" y="-31" width="36" height="62" rx="8" />
      <path d="M-6 24h12" opacity=".55" />
    </g>
  );
}

export function FeaturedGameArt({ gameId }: { gameId: FeaturedGameArtId }) {
  if (gameId === "shot-classic") {
    return (
      <svg aria-hidden="true" viewBox="0 0 320 180" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="226" cy="87" r="72" opacity=".09" />
        <circle cx="226" cy="87" r="53" opacity=".08" />
        <path d="M24 132c46-35 90-45 139-30 45 14 84 14 133-12" opacity=".32" />
        <path d="M31 149c52-24 99-29 142-15 39 13 79 10 121-7" strokeDasharray="4 8" opacity=".18" />
        <ellipse cx="77" cy="61" rx="45" ry="13" transform="rotate(-12 77 61)" />
        <path d="M37 69c33 13 64 13 92-2" />
        <path d="M225 35v104M199 63h52M205 76h40M211 89h28M217 102h16" />
        <path d="M189 139h72M200 151h50" />
        <path d="M114 58c42-7 76-2 105 17" strokeDasharray="7 8" opacity=".65" />
        <path d="m209 68 11 7-10 8" opacity=".72" />
        <circle cx="225" cy="35" r="4" fill="currentColor" stroke="none" />
        <circle cx="77" cy="61" r="3" fill="currentColor" stroke="none" opacity=".5" />
      </svg>
    );
  }

  if (gameId === "clear-the-stack") {
    return (
      <svg aria-hidden="true" viewBox="0 0 320 180" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="102" cy="83" r="66" opacity=".08" />
        <circle cx="102" cy="83" r="50" opacity=".06" />
        <path d="M54 133h98M64 120h78M74 107h58M84 94h38" opacity=".86" />
        <ellipse cx="103" cy="82" rx="42" ry="10" />
        <ellipse cx="103" cy="66" rx="35" ry="8" />
        <ellipse cx="103" cy="52" rx="28" ry="7" />
        <path d="M211 33v105M185 61h52M191 75h40M197 89h28M203 103h16" />
        <path d="M178 138h66M189 150h44" />
        <path d="M143 71c32-10 54-9 68 2" strokeDasharray="7 8" opacity=".62" />
        <path d="m200 67 11 7-10 8" opacity=".72" />
        <path d="M52 145c36 8 74 7 112-3" strokeDasharray="4 7" opacity=".28" />
        <g opacity=".55">
          <circle cx="60" cy="31" r="8" /><text x="57" y="35" fill="currentColor" stroke="none" fontSize="10" fontWeight="900">1</text>
          <circle cx="84" cy="25" r="8" /><text x="81" y="29" fill="currentColor" stroke="none" fontSize="10" fontWeight="900">2</text>
          <circle cx="108" cy="29" r="8" /><text x="105" y="33" fill="currentColor" stroke="none" fontSize="10" fontWeight="900">3</text>
        </g>
        <circle cx="211" cy="33" r="4" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (gameId === "phone-holdem") {
    return (
      <svg aria-hidden="true" viewBox="0 0 320 180" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="226" cy="89" r="58" opacity=".09" />
        <Phone x={234} y={88} rotate={7} scale={1.45} />
        <rect x="45" y="37" width="64" height="94" rx="12" transform="rotate(-10 45 37)" />
        <rect x="103" y="31" width="64" height="94" rx="12" transform="rotate(5 103 31)" />
        <text x="66" y="61" fill="currentColor" stroke="none" fontSize="15" fontWeight="900">A</text>
        <text x="125" y="55" fill="currentColor" stroke="none" fontSize="15" fontWeight="900">K</text>
        <path d="M135 58c5-9 18-4 16 6-2 7-16 18-16 18s-14-11-16-18c-2-10 11-15 16-6Z" fill="currentColor" stroke="none" opacity=".68" />
        <circle cx="59" cy="132" r="19" />
        <circle cx="59" cy="132" r="11" strokeDasharray="4 5" opacity=".6" />
        <path d="M219 74h30M219 87h30M219 100h30" opacity=".55" />
        <path d="M38 151c72 9 139 6 203-9" strokeDasharray="4 8" opacity=".25" />
      </svg>
    );
  }

  if (gameId === "live-craps") {
    return (
      <svg aria-hidden="true" viewBox="0 0 320 180" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="163" cy="88" r="73" opacity=".08" />
        <path d="M31 145c58-29 207-29 264 0M50 157c55-20 164-20 220 0" opacity=".38" />
        <Phone x={44} y={119} rotate={-12} scale={0.72} />
        <Phone x={276} y={119} rotate={12} scale={0.72} />
        <rect x="55" y="36" width="76" height="76" rx="14" transform="rotate(-9 55 36)" />
        <rect x="157" y="42" width="76" height="76" rx="14" transform="rotate(10 157 42)" />
        {[0,1,2].map((row) => [0,1,2].map((col) => <circle key={`l-${row}-${col}`} cx={78 + col * 18} cy={57 + row * 18} r="4" fill="currentColor" stroke="none" opacity={(row + col) % 2 === 0 ? 0.95 : 0.28} />))}
        <circle cx="181" cy="63" r="4" fill="currentColor" stroke="none" />
        <circle cx="212" cy="92" r="4" fill="currentColor" stroke="none" />
        <path d="M245 37c20 12 31 29 34 51" strokeDasharray="7 8" opacity=".62" />
        <path d="m269 80 10 9-12 5" opacity=".72" />
        <path d="M247 110c-17 18-40 29-68 32" strokeDasharray="4 8" opacity=".28" />
      </svg>
    );
  }

  if (gameId === "quest-digital") {
    return (
      <svg aria-hidden="true" viewBox="0 0 320 180" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M44 46c34-13 68-9 102 12v91c-34-20-68-24-102-12V46ZM276 46c-34-13-68-9-102 12v91c34-20 68-24 102-12V46Z" opacity=".34" />
        <circle cx="160" cy="91" r="77" opacity=".06" />
        <path d="M160 22 207 45v39c0 30-17 51-47 67-30-16-47-37-47-67V45l47-23Z" />
        <path d="m160 50 10 22 24 4-17 17 4 24-21-12-21 12 4-24-17-17 24-4 10-22Z" />
        <path d="M47 126c25-30 48-44 70-45M203 81c25 4 48 18 70 46" strokeDasharray="7 8" opacity=".62" />
        <circle cx="50" cy="125" r="6" fill="currentColor" stroke="none" opacity=".6" />
        <circle cx="270" cy="127" r="6" fill="currentColor" stroke="none" opacity=".6" />
        <circle cx="87" cy="94" r="4" />
        <circle cx="236" cy="101" r="4" />
        <path d="M64 58c18-6 35-3 52 8M204 66c17-11 34-14 52-8" strokeDasharray="3 7" opacity=".3" />
      </svg>
    );
  }

  return null;
}