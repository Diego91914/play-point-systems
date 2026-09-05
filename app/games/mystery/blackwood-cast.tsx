"use client";

import type { CSSProperties } from "react";

export type BlackwoodRoleId = "partner" | "sister" | "chef" | "murderer" | "lawyer" | "assistant" | "cousin" | "neighbor";

export const BLACKWOOD_CAST_ART = "/blackwood/blackwood-cast.jpg";

const PORTRAIT_POSITION: Record<BlackwoodRoleId, { x: string; y: string }> = {
  partner: { x: "0%", y: "0%" },
  sister: { x: "33.333%", y: "0%" },
  chef: { x: "66.667%", y: "0%" },
  murderer: { x: "100%", y: "0%" },
  lawyer: { x: "0%", y: "100%" },
  assistant: { x: "33.333%", y: "100%" },
  cousin: { x: "66.667%", y: "100%" },
  neighbor: { x: "100%", y: "100%" },
};

export function BlackwoodPortrait({ roleId, className = "", style }: { roleId: string | null | undefined; className?: string; style?: CSSProperties }) {
  const pos = roleId && roleId in PORTRAIT_POSITION ? PORTRAIT_POSITION[roleId as BlackwoodRoleId] : null;
  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden bg-[#0a1116] ${className}`}
      style={pos ? {
        backgroundImage: `url(${BLACKWOOD_CAST_ART})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "400% 200%",
        backgroundPosition: `${pos.x} ${pos.y}`,
        ...style,
      } : style}
    />
  );
}
