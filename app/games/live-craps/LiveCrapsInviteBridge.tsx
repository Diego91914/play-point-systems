"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

function setControlledInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function findHostLobbyCode() {
  const startButton = Array.from(document.querySelectorAll("button")).find(
    (button) => button.textContent?.trim() === "START TABLE",
  );
  if (!startButton) return "";

  const roomLabel = Array.from(document.querySelectorAll("p")).find((node) =>
    node.textContent?.trim().startsWith("LIVE CRAPS · "),
  );
  return roomLabel?.textContent?.trim().replace("LIVE CRAPS · ", "") ?? "";
}

export function LiveCrapsInviteBridge() {
  const [hostCode, setHostCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incoming = (params.get("code") ?? "").trim().toUpperCase();
    if (incoming) setInviteCode(incoming);

    let stopped = false;
    let attempts = 0;
    const prefill = () => {
      if (stopped || !incoming) return;
      const input = document.querySelector<HTMLInputElement>('input[placeholder="Room code to join"]');
      const nameInput = document.querySelector<HTMLInputElement>('input[placeholder="Your name"]');
      if (input) {
        setControlledInputValue(input, incoming);
        nameInput?.focus();
        return;
      }
      attempts += 1;
      if (attempts < 40) window.setTimeout(prefill, 100);
    };
    prefill();

    const scan = () => setHostCode(findHostLobbyCode());
    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      stopped = true;
      observer.disconnect();
    };
  }, []);

  const joinUrl = useMemo(
    () => hostCode ? `https://www.playamplified.com/games/live-craps?code=${encodeURIComponent(hostCode)}&invite=1` : "",
    [hostCode],
  );

  async function copyInvite() {
    if (!joinUrl) return;
    await navigator.clipboard?.writeText(joinUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      {inviteCode && !hostCode ? (
        <div className="fixed inset-x-3 top-3 z-[60] mx-auto max-w-md rounded-2xl border border-cyan-200/30 bg-[#082418]/95 px-4 py-3 text-center text-white shadow-2xl backdrop-blur">
          <p className="text-[10px] font-black tracking-[.22em] text-cyan-200">HOST INVITE</p>
          <p className="mt-1 text-sm font-black">LIVE CRAPS · {inviteCode}</p>
          <p className="mt-1 text-xs text-white/70">Enter your name below and tap JOIN TABLE. No Play Amplified account is required for an invited player.</p>
        </div>
      ) : null}

      {hostCode ? (
        <aside className="fixed bottom-4 left-1/2 z-[70] w-[calc(100%-24px)] max-w-sm -translate-x-1/2 rounded-[28px] border border-amber-300/40 bg-[#071c13]/95 p-4 text-center text-white shadow-2xl backdrop-blur">
          <p className="text-[10px] font-black tracking-[.25em] text-amber-300">INVITE PLAYERS</p>
          <h2 className="mt-1 text-xl font-black">Scan to join Live Craps</h2>
          <div className="mx-auto mt-3 w-fit rounded-2xl bg-white p-3">
            <QRCodeSVG value={joinUrl} size={168} level="M" includeMargin={false} />
          </div>
          <p className="mt-3 text-xs text-emerald-100">Founder/builder host room is active for guest joining during private testing.</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="rounded-xl bg-white/10 px-4 py-2 text-lg font-black tracking-[.2em]">{hostCode}</span>
            <button type="button" onClick={copyInvite} className="rounded-xl bg-amber-300 px-3 py-2 text-xs font-black text-black">
              {copied ? "COPIED" : "COPY LINK"}
            </button>
          </div>
        </aside>
      ) : null}
    </>
  );
}
