"use client";

import { useEffect, useMemo, useState } from "react";
import "./MysteryPortraitChoices.module.css";

type Session = { code: string; playerId: string; token: string };
type CastMember = { id: string; name: string; seat: number; roleId: string | null; roleTitle: string | null };

const KEY = "pps-mystery-session";
const POSITION: Record<string, { x: string; y: string }> = {
  partner: { x: "0%", y: "0%" },
  sister: { x: "33.333%", y: "0%" },
  chef: { x: "66.667%", y: "0%" },
  murderer: { x: "100%", y: "0%" },
  lawyer: { x: "0%", y: "100%" },
  assistant: { x: "33.333%", y: "100%" },
  cousin: { x: "66.667%", y: "100%" },
  neighbor: { x: "100%", y: "100%" },
};

export function MysteryPortraitChoices() {
  const [session, setSession] = useState<Session | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/games/mystery/${session.code}/cast?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`, { cache: "no-store" });
        if (!response.ok) return;
        const json = await response.json();
        if (!cancelled) setCast(Array.isArray(json.cast) ? json.cast : []);
      } catch {}
    };
    void refresh();
    const timer = window.setInterval(refresh, 1800);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [session]);

  const byName = useMemo(() => new Map(cast.filter(member => member.roleId).map(member => [member.name.trim(), member])), [cast]);

  useEffect(() => {
    const decorate = () => {
      const buttons = document.querySelectorAll<HTMLButtonElement>("main button");
      buttons.forEach(button => {
        if (button.textContent?.trim() === "ASK THE QUESTION") button.textContent = "ASK THIS QUESTION OUT LOUD";
        const member = byName.get(button.textContent?.trim() ?? "");
        if (!member?.roleId || !POSITION[member.roleId]) return;
        const pos = POSITION[member.roleId];
        button.classList.add("blackwood-portrait-choice");
        button.style.setProperty("--bw-portrait-x", pos.x);
        button.style.setProperty("--bw-portrait-y", pos.y);
        button.setAttribute("aria-label", `${member.name}, ${member.roleTitle ?? "suspect"}`);
      });
    };
    decorate();
    const observer = new MutationObserver(decorate);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [byName]);

  return null;
}
