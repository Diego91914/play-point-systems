import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "../components/SiteShell";
import { founder } from "../site-content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Play Point Systems about products, venues, partnerships, support, or music.",
};

const inquiries = [
  {
    title: "Products and venues",
    body: "Quick Score, Play Point Live, Shot Caddy, group play, or venue experiences.",
    subject: "Play Point product or venue inquiry",
  },
  {
    title: "Music",
    body: "Play Point Records, releases, collaboration, licensing, or artist conversations.",
    subject: "Play Point Records inquiry",
  },
  {
    title: "Business and partnerships",
    body: "Company partnerships, media, and broader business questions.",
    subject: "Play Point Systems partnership inquiry",
  },
] as const;

export default function ContactPage() {
  return (
    <SiteShell current="contact">
      <section className="px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-12 lg:px-10 lg:pb-20 lg:pt-16">
        <div className="max-w-4xl">
          <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">Contact</div>
          <h1 className="mt-5 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">Start a real conversation.</h1>
          <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-cyan-100/88 sm:text-xl">
            Product, venue, music, and partnership inquiries go directly to {founder.name}, founder of Play Point Systems.
          </p>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/74">
            Choose the closest topic below to open a pre-addressed email, or use the direct contact information anytime.
          </p>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <aside className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.1),rgba(255,255,255,0.03))] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/58">Direct contact</div>
            <div className="mt-4 text-3xl font-black text-white">{founder.name}</div>
            <div className="mt-2 text-lg font-semibold text-white/72">{founder.contactTitle} · {founder.company}</div>

            <div className="mt-6 grid gap-3">
              <a href={`mailto:${founder.email}`} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:bg-black/28 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">Email</div>
                <div className="mt-2 break-all text-base font-black text-white sm:text-lg">{founder.email}</div>
              </a>
              <a href={`tel:${founder.phoneHref}`} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:bg-black/28 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">Phone</div>
                <div className="mt-2 text-lg font-black text-white">{founder.phone}</div>
              </a>
              <Link href="/support" className="rounded-2xl border border-cyan-300/18 bg-cyan-400/8 px-4 py-4 transition hover:bg-cyan-400/13">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/65">Existing customer?</div>
                <div className="mt-2 text-lg font-black text-cyan-50">Visit Support</div>
              </Link>
            </div>
          </aside>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/58">What can we help with?</div>
            <div className="mt-4 grid gap-4">
              {inquiries.map((inquiry) => (
                <article key={inquiry.title} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
                  <div>
                    <h2 className="text-2xl font-black text-white">{inquiry.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-white/72">{inquiry.body}</p>
                  </div>
                  <a
                    href={`mailto:${founder.email}?subject=${encodeURIComponent(inquiry.subject)}`}
                    className="mt-4 inline-flex shrink-0 rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-black text-white transition hover:bg-white/12 sm:mt-0"
                  >
                    Email About This
                  </a>
                </article>
              ))}
            </div>
            <p className="mt-5 text-sm leading-7 text-white/65">Please include the product or project name and the best way to reach you. We will respond as soon as possible.</p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
