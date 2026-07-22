import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "../components/SiteShell";
import { founder } from "../site-content";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with Play Point Live, Quick Score, Shot Caddy, trivia, purchases, or account recovery.",
};

const supportTopics = [
  { title: "Quick Score", body: "Scoring, live spectator links, clubs, events, saved matches, or installing the web app." },
  { title: "Purchases", body: "Quick Score Pro checkout, purchase verification, access restoration, or refund questions." },
  { title: "Trivia and live experiences", body: "Room codes, host controls, player joins, venue demos, or event questions." },
  { title: "Shot Caddy", body: "Golf-first products, access notices, and questions about ShotCaddy.net." },
] as const;

export default function SupportPage() {
  const supportHref = `mailto:${founder.email}?subject=${encodeURIComponent("Play Point support request")}`;

  return (
    <SiteShell current="contact">
      <section className="px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-12 lg:px-10 lg:pb-20 lg:pt-16">
        <div className="max-w-4xl">
          <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-50/82">Support</div>
          <h1 className="mt-5 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">We&apos;ll help you get back to playing.</h1>
          <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-cyan-100/88 sm:text-xl">
            Tell us what you were using, what you expected to happen, and what happened instead.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={supportHref} className="inline-flex rounded-2xl border border-cyan-200/30 bg-cyan-400/12 px-5 py-3.5 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/18">Email Support</a>
            <Link href="/contact" className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3.5 text-sm font-black text-white transition hover:bg-white/12">Other Inquiries</Link>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="grid gap-5 md:grid-cols-2">
          {supportTopics.map((topic) => (
            <article key={topic.title} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-2xl font-black text-white">{topic.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/74">{topic.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/58">Include in your message</div>
            <ul className="mt-5 grid gap-3 text-sm leading-7 text-white/76">
              <li>• The product and page you were using</li>
              <li>• Your device and browser</li>
              <li>• The public room or session code, if relevant</li>
              <li>• A screenshot and the exact error message</li>
            </ul>
          </div>
          <div className="rounded-[28px] border border-amber-300/16 bg-amber-400/[0.06] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/70">Protect your information</div>
            <p className="mt-5 text-sm leading-7 text-white/76">
              Never email a full payment-card number, Stripe login, password, or private Quick Score recovery code. We may ask for a Stripe receipt or checkout reference, but not your complete card details.
            </p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
