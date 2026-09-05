"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./MysteryMoments.module.css";

type Session = { code: string; playerId: string; token: string };
type Evidence = { title: string } | null;

const KEY = "pps-mystery-session";
const ART: Record<string, string> = {
  "The time of death": "/blackwood/evidence-time-of-death.svg",
  "The death window": "/blackwood/evidence-time-of-death.svg",
  "The rinsed whiskey glass": "/blackwood/evidence-whiskey-glass.svg",
  "The back porch": "/blackwood/evidence-back-porch.svg",
  "The blue ledger": "/blackwood/evidence-blue-ledger.svg",
};

export function MysteryEvidenceArt() {
  const [session, setSession] = useState<Session | null>(null);
  const [evidence, setEvidence] = useState<Evidence>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);

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
        const response = await fetch(`/api/games/mystery/${session.code}?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`, { cache: "no-store" });
        if (!response.ok) return;
        const json = await response.json();
        if (!cancelled) setEvidence(json.state?.status === "evidence" ? json.state?.evidence ?? null : null);
      } catch {}
    };
    void refresh();
    const timer = window.setInterval(refresh, 1000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [session]);

  useEffect(() => {
    if (!evidence?.title) { setTarget(null); return; }
    const find = () => {
      const headings = Array.from(document.querySelectorAll<HTMLElement>("main h3"));
      const heading = headings.find(node => node.textContent?.trim() === evidence.title);
      setTarget(heading?.parentElement ?? null);
    };
    find();
    const observer = new MutationObserver(find);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [evidence?.title]);

  const src = evidence?.title ? ART[evidence.title] : null;
  if (!target || !evidence?.title || !src) return null;

  return createPortal(
    <div key={evidence.title} className={`${styles.evidenceDrop} mb-5 overflow-hidden rounded-2xl border border-amber-200/25 bg-[#090e12] shadow-[0_18px_55px_rgba(0,0,0,.38)]`}>
      <img src={src} alt={`Visual exhibit for ${evidence.title}`} className={`${styles.evidenceImage} block aspect-[16/9] w-full object-cover`} />
      <div className="flex items-center justify-between gap-3 border-t border-amber-200/15 px-4 py-3">
        <div className="text-[10px] font-black uppercase tracking-[.22em] text-amber-100/70">Blackwood evidence exhibit</div>
        <div className="text-[10px] font-bold uppercase tracking-[.12em] text-white/35">Examine · discuss · connect</div>
      </div>
    </div>,
    target,
  );
}
