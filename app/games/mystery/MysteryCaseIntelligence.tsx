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

function findInterview(interviews: Interview[], needles: string[]) {
  return interviews.find(item => {
    const answer = item.answer.toLowerCase();
    return needles.some(needle => answer.includes(needle));
  });
}

function findBathroomClaim(interviews: Interview[]) {
  return findInterview(interviews, ["downstairs bathroom", "bathroom at 10:30", "bathroom during the critical window"]);
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

function oldFriendAlerts(caseFile: CaseFile): IntelligenceAlert[] {
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
        `${bathroom.target} placed themselves around the downstairs bathroom during the critical period.`,
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
          oldMoney ? `${bathroom.target} described the old financial dispute as settled.` : `${bathroom.target} denied firsthand knowledge of the ledger.`,
          "The recovered ledger documents a decades-old theft and an unresolved personal relationship.",
        ],
        caution: "The wording points toward a relationship, not automatically toward a specific person. Test the connection before drawing a conclusion.",
      });
    }
  }

  return alerts;
}

function businessPartnerAlerts(caseFile: CaseFile): IntelligenceAlert[] {
  const alerts: IntelligenceAlert[] = [];
  const study = findInterview(caseFile.interviews, ["downstairs study", "study at 10:30", "stayed with the copied records"]);

  if (study && hasEvidence(caseFile, "torn bank-record fragment")) {
    alerts.push({
      id: "study-record-fragment",
      label: "Connection worth testing",
      title: `${study.target}'s study story now intersects with physical evidence`,
      facts: [
        `${study.target} placed themselves around the downstairs study or copied records.`,
        "A torn fragment from a copied Blackwood Holdings packet was recovered near the kitchen/back-door route.",
      ],
      caution: "The fragment connects locations and paperwork. It does not prove who carried it through the rear route.",
    });
  }

  if (study && hasEvidence(caseFile, "rear route")) {
    alerts.push({
      id: "study-route-pressure",
      label: "Timeline pressure",
      title: "The study alibi deserves a minute-by-minute check",
      facts: [
        `${study.target}'s earlier answer places them around the study.`,
        "The rear-route evidence shows movement from the library side near the end of the death window.",
      ],
      caution: "Ask whether anyone can verify the full 10:31–10:35 interval. An unverified gap is not itself proof of guilt.",
    });
  }

  return alerts;
}

function sisterAlerts(caseFile: CaseFile): IntelligenceAlert[] {
  const alerts: IntelligenceAlert[] = [];
  const garden = findInterview(caseFile.interviews, ["garden gate", "family accountant", "outside near the garden"]);

  if (garden && hasEvidence(caseFile, "garden-call gap")) {
    alerts.push({
      id: "garden-call-pressure",
      label: "Possible contradiction",
      title: `${garden.target}'s call may not cover the whole death window`,
      facts: [
        `${garden.target} used the accountant call as part of their timeline.`,
        "Phone records show that call briefly disconnected during the fatal window before reconnecting.",
      ],
      caution: "A disconnected call creates opportunity, not identity. Re-check what could happen during that gap.",
    });
  }

  if (garden && hasEvidence(caseFile, "cream-paper fragment")) {
    alerts.push({
      id: "garden-paper-link",
      label: "Connection worth testing",
      title: "The inheritance papers moved beyond the room where they belonged",
      facts: [
        "A cream legal-paper fragment was found near the kitchen threshold.",
        "The paper stock matches inheritance documents involved in the family dispute.",
      ],
      caution: "The paper connects the dispute to a route through the house, but not automatically to the person who carried it.",
    });
  }

  return alerts;
}

function chefAlerts(caseFile: CaseFile): IntelligenceAlert[] {
  const alerts: IntelligenceAlert[] = [];
  const kitchen = findInterview(caseFile.interviews, ["cleaning in the kitchen", "kitchen continuously", "kitchen at 10:30"]);

  if (kitchen && hasEvidence(caseFile, "service gap")) {
    alerts.push({
      id: "kitchen-service-gap",
      label: "Possible contradiction",
      title: `${kitchen.target}'s continuous-kitchen story needs another look`,
      facts: [
        `${kitchen.target} described continuous kitchen work during the critical period.`,
        "Kitchen activity logs show an unexplained pause during the fatal window.",
      ],
      caution: "The pause creates an unaccounted interval. It does not by itself establish where anyone went.",
    });
  }

  if (kitchen && hasEvidence(caseFile, "rinsed prep trace")) {
    alerts.push({
      id: "kitchen-trace-link",
      label: "Connection worth testing",
      title: "The sink contains a second cleanup story",
      facts: [
        "A freshly rinsed prep trace contains residue from Adrian's private plate.",
        `${kitchen.target}'s answers establish firsthand control of dinner service and cleanup.`,
      ],
      caution: "Kitchen access explains opportunity to handle the trace, not necessarily why or when it was rinsed.",
    });
  }

  return alerts;
}

export function buildMysteryCaseAlerts(caseFile?: CaseFile): IntelligenceAlert[] {
  if (!caseFile) return [];
  if (hasEvidence(caseFile, "torn bank-record fragment") || hasEvidence(caseFile, "company records")) return businessPartnerAlerts(caseFile);
  if (hasEvidence(caseFile, "garden-call gap") || hasEvidence(caseFile, "cream-paper fragment")) return sisterAlerts(caseFile);
  if (hasEvidence(caseFile, "service gap") || hasEvidence(caseFile, "rinsed prep trace")) return chefAlerts(caseFile);
  return oldFriendAlerts(caseFile);
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

  const alerts = useMemo(() => buildMysteryCaseAlerts(snapshot?.caseFile), [snapshot]);
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
