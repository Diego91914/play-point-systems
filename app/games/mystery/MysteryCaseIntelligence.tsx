"use client";

import { useEffect, useMemo, useState } from "react";

type Session = { code: string; playerId: string; token: string };
type Interview = { questioner: string; target: string; question: string; answer: string };
type CaseFile = {
  evidence: { index: number; title: string; text: string }[];
  interviews: Interview[];
};
type Snapshot = {
  status: "lobby" | "interrogation" | "evidence" | "accusation" | "reveal";
  caseFile?: CaseFile;
};
type IntelligenceAlert = {
  id: string;
  label: "Possible contradiction" | "Timeline pressure" | "Connection worth testing";
  title: string;
  facts: string[];
  caution: string;
};

const KEY = "pps-mystery-session";

function hasEvidence(caseFile: CaseFile, title: string) {
  return caseFile.evidence.some(item => item.title.toLowerCase().includes(title.toLowerCase()));
}

function findBathroomClaim(interviews: Interview[]) {
  return interviews.find(item => {
    const answer = item.answer.toLowerCase();
    return answer.includes("downstairs bathroom") || (answer.includes("bathroom") && answer.includes("10:40"));
  });
}

function findOldMoneyClaim(interviews: Interview[], target: string) {
  return interviews.find(item => item.target === target && (
    item.answer.toLowerCase().includes("old money dispute") ||
    item.answer.toLowerCase().includes("old disagreement") ||
    item.answer.toLowerCase().includes("settled years ago")
  ));
}

function findLedgerDenial(interviews: Interview[], target: string) {
  return interviews.find(item => item.target === target && (
    item.answer.toLowerCase().includes("never saw the blue ledger") ||
    item.answer.toLowerCase().includes("never saw the ledger")
  ));
}

function buildAlerts(caseFile?: CaseFile): IntelligenceAlert[] {
  if (!caseFile) return [];
  const alerts: IntelligenceAlert[] = [];
  const bathroom = findBathroomClaim(caseFile.interviews);

  if (bathroom && hasEvidence(caseFile, "rinsed whiskey glass")) {
    alerts.push({
      id: "bathroom-glass",
      label: "Timeline pressure",
      title: `${bathroom.target}'s timeline deserves another look`,
      facts: [
        `${bathroom.target} said: “${bathroom.answer}”`,
        "A freshly rinsed whiskey glass appeared in the kitchen shortly after the murder.",
      ],
      caution: "The glass does not identify who rinsed it. This is a timing question, not proof of guilt.",
    });
  }

  if (bathroom && hasEvidence(caseFile, "back porch")) {
    alerts.push({
      id: "bathroom-porch",
      label: "Possible contradiction",
      title: "Two parts of the timeline may not fit together",
      facts: [
        `${bathroom.target} said they were in the downstairs bathroom through roughly 10:40.`,
        "A witness saw a dark-jacket figure cross the back porch around 10:35 toward the kitchen entrance.",
      ],
      caution: `This only becomes a contradiction if the porch figure was ${bathroom.target}. The evidence does not establish that by itself.`,
    });
  }

  if (bathroom && hasEvidence(caseFile, "blue ledger")) {
    const oldMoney = findOldMoneyClaim(caseFile.interviews, bathroom.target);
    const ledgerDenial = findLedgerDenial(caseFile.interviews, bathroom.target);
    if (oldMoney || ledgerDenial) {
      alerts.push({
        id: "old-friend-ledger",
        label: "Connection worth testing",
        title: "The old financial story now matters more",
        facts: [
          oldMoney ? `${bathroom.target} described the old financial dispute as settled.` : `${bathroom.target} said they had never seen the blue ledger.`,
          "The recovered ledger documents a decades-old theft and contains the note: “Old friend. Last chance to make this right.”",
        ],
        caution: "The wording points toward a relationship, not automatically toward a specific person. Ask follow-up questions before drawing a conclusion.",
      });
    }
  }

  return alerts;
}

export function MysteryCaseIntelligence() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    let active = true;
    let timer = 0;

    async function refresh() {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return;
        const session = JSON.parse(raw) as Session;
        if (!session.code || !session.playerId || !session.token) return;
        const response = await fetch(`/api/games/mystery/${session.code}?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`, { cache: "no-store" });
        if (!response.ok) return;
        const json = await response.json();
        if (active) setSnapshot(json.state as Snapshot);
      } catch {}
    }

    void refresh();
    timer = window.setInterval(refresh, 1200);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const alerts = useMemo(() => buildAlerts(snapshot?.caseFile), [snapshot]);
  if (!snapshot || snapshot.status === "lobby" || alerts.length === 0) return null;

  return (
    <section className="mx-auto mt-5 max-w-3xl px-4 pb-3 sm:px-8">
      <details className="rounded-[24px] border border-amber-200/20 bg-amber-200/[.045] p-5">
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.22em] text-amber-100/70">Case File Intelligence</div>
              <div className="mt-1 text-lg font-black text-white">{alerts.length} connection{alerts.length === 1 ? "" : "s"} worth reviewing</div>
            </div>
            <div className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-xs font-black text-amber-100">REVIEW</div>
          </div>
        </summary>
        <div className="mt-4 space-y-3">
          {alerts.map(alert => (
            <article key={alert.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] font-black uppercase tracking-[.18em] text-amber-100/65">⚠ {alert.label}</div>
              <h3 className="mt-1 text-base font-black text-white">{alert.title}</h3>
              <div className="mt-3 space-y-2">
                {alert.facts.map((fact, index) => <p key={index} className="text-sm leading-6 text-white/70">• {fact}</p>)}
              </div>
              <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-white/45">{alert.caution}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-white/40">The phone compares facts. It does not decide what they mean.</p>
      </details>
    </section>
  );
}
