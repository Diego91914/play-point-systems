"use client";

import Script from "next/script";
import type { FormEvent } from "react";
import { useState } from "react";

declare global {
  interface Window {
    turnstile?: { reset: () => void };
  }
}

type ContactFormProps = {
  kind: "contact" | "support";
};

const productOptions = [
  "Quick Score",
  "Play Point Trivia",
  "Play Point Live / Venue",
  "Shot Caddy",
  "Play Point Records",
  "Partnership or other",
] as const;

const topicOptions = {
  contact: ["Product or venue inquiry", "Music inquiry", "Business or partnership", "Media or licensing", "Other"],
  support: ["Technical problem", "Purchase or account", "Room or session help", "Access question", "Other support"],
} as const;

export function ContactForm({ kind }: ContactFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          name: data.get("name"),
          email: data.get("email"),
          topic: data.get("topic"),
          product: data.get("product"),
          message: data.get("message"),
          company: data.get("company"),
          turnstileToken: data.get("cf-turnstile-response"),
        }),
      });
      const result = (await response.json()) as { sent?: boolean; error?: string };

      if (!response.ok || !result.sent) {
        setStatus({ tone: "error", message: result.error || "We could not deliver your message." });
        return;
      }

      form.reset();
      setStatus({
        tone: "success",
        message: kind === "support" ? "Your support request has been received." : "Thanks. Your message has been received.",
      });
    } catch {
      setStatus({ tone: "error", message: "We could not deliver your message. Please use the direct email link below." });
    } finally {
      window.turnstile?.reset();
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-[30px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-white/88">
          Name
          <input name="name" required maxLength={100} autoComplete="name" className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/40 focus:border-cyan-300/40" placeholder="Your name" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-white/88">
          Email
          <input name="email" required type="email" maxLength={180} autoComplete="email" className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/40 focus:border-cyan-300/40" placeholder="you@example.com" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-white/88">
          Topic
          <select name="topic" required defaultValue="" className="rounded-2xl border border-white/12 bg-[#07101c] px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300/40">
            <option value="" disabled>Choose a topic</option>
            {topicOptions[kind].map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-white/88">
          Product
          <select name="product" required defaultValue="" className="rounded-2xl border border-white/12 bg-[#07101c] px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300/40">
            <option value="" disabled>Choose a product</option>
            {productOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <label className="mt-4 grid gap-2 text-sm font-semibold text-white/88">
        Message
        <textarea name="message" required minLength={10} maxLength={4000} rows={6} className="resize-y rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-base leading-7 text-white outline-none transition placeholder:text-white/40 focus:border-cyan-300/40" placeholder={kind === "support" ? "What were you using, and what happened?" : "Tell us what you would like to discuss."} />
      </label>

      <label className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        Company
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>

      {turnstileSiteKey ? (
        <div className="mt-5">
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="afterInteractive"
          />
          <div
            className="cf-turnstile"
            data-sitekey={turnstileSiteKey}
            data-theme="dark"
            data-size="flexible"
          />
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={submitting} className="rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-5 py-3.5 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.2)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? "Sending..." : kind === "support" ? "Send Support Request" : "Send Message"}
        </button>
        <a href="mailto:channing@playpointsystems.com" className="text-sm font-semibold text-white/70 underline decoration-white/25 underline-offset-4 transition hover:text-white">Use direct email instead</a>
      </div>

      <div aria-live="polite">
        {status ? (
          <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${status.tone === "success" ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100" : "border-amber-300/25 bg-amber-400/10 text-amber-100"}`}>
            {status.message}
          </div>
        ) : null}
      </div>
    </form>
  );
}
