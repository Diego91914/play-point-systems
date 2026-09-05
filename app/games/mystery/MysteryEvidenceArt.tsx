"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Session = { code: string; playerId: string; token: string };
type Evidence = { title: string } | null;

const KEY = "pps-mystery-session";
const SPRITE = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCACWAfQDASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAAAwQAAgUBBgf/xAA/EAACAQMCBAQDBgUDAwMFAAABAgMABBESIQUxQVETImFxMoGRBhRCobHBI1Jy0fAVYuEkMzRDU3MWNWOSov/EABkBAAMBAQEAAAAAAAAAAAAAAAABAgMEBf/EACQRAAICAgICAwEBAQEAAAAAAAABAhEhMQMSQVETIjIEYXGB/9oADAMBAAIRAxEAPwDwEqnRmgRqWO1MykmM0CEkHapTwU9nJFKneuAeWrSktua4vw0xeSR/FTMcDSajggDntRbK0DupJJOMhQOtaVxN91VUR11AbqefvSGtGb9xCR6pSY88tWx+lWW1tmTBbB5AjfeuySl5G0kkgZBO+aZjSAx4Y5kIXyrsCd6YCRskbZXww9OdLyWzxyADzDvWk1qHZnjbXo69KC+qJMuWIz8qAEJVKvpYYIrijLU47JcY1YQ4wDjnQWiKS7bqdwaV4CgerQTsD711HBbdPoa5IAG3FDIwdqEhaL48xHrW5wqATxeD1knUfLG9YK5zXoPs/cW1vMZLwTNEDt4JAIOKz5r64NeJ5PpKXsaSBFIxGn0/zFDHEkZplPI4/MYrGt+J/Zp3C6LnxHIXDaySe2xq0r8C4cgi4i06TNkgnWCRnbkcbV5/SWjq7R3R5r7XKDxKK4X/ANWMKf6lNedBdgoGwJH611/f3Ny+QqRTsD01x0rVQ4DiRUqUQj/2Q==";

const POSITION: Record<string, string> = {
  "The time of death": "25% 50%",
  "The death window": "25% 50%",
  "The rinsed whiskey glass": "50% 50%",
  "The back porch": "75% 50%",
  "The blue ledger": "100% 50%",
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

  if (!target || !evidence?.title || !POSITION[evidence.title]) return null;

  return createPortal(
    <div className="order-first mb-5 overflow-hidden rounded-2xl border border-amber-200/25 bg-[#090e12] shadow-[0_18px_55px_rgba(0,0,0,.38)]">
      <div
        role="img"
        aria-label={`Visual exhibit for ${evidence.title}`}
        className="aspect-[16/9] w-full bg-cover"
        style={{ backgroundImage: `url(${SPRITE})`, backgroundSize: "500% 100%", backgroundPosition: POSITION[evidence.title] }}
      />
      <div className="flex items-center justify-between gap-3 border-t border-amber-200/15 px-4 py-3">
        <div className="text-[10px] font-black uppercase tracking-[.22em] text-amber-100/70">Blackwood evidence exhibit</div>
        <div className="text-[10px] font-bold uppercase tracking-[.12em] text-white/35">Examine · discuss · connect</div>
      </div>
    </div>,
    target,
  );
}
