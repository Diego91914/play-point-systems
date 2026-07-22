import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "../components/ContactForm";
import { SiteShell } from "../components/SiteShell";
import { founder } from "../site-content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Play Point Systems about products, venues, partnerships, support, or music.",
};

export default function ContactPage() {
  return (
    <SiteShell current="contact">
      <section className="px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-12 lg:px-10 lg:pb-20 lg:pt-16">
        <div className="min-w-0 max-w-4xl">
          <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">Contact</div>
          <h1 className="marketing-headline mt-5 lg:text-7xl">Start a real conversation.</h1>
          <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-cyan-100/88 sm:text-xl">
            Product, venue, music, and partnership inquiries go directly to {founder.name}, founder of Play Point Systems.
          </p>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/74">
            Send a structured message here, or use the direct contact information anytime.
          </p>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <aside className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.1),rgba(255,255,255,0.03))] p-6">
            <div className="section-label">Direct contact</div>
            <div className="mt-4 text-3xl font-black text-white">{founder.name}</div>
            <div className="mt-2 text-lg font-semibold text-white/72">{founder.contactTitle} · {founder.company}</div>

            <div className="mt-6 grid gap-3">
              <a href={`mailto:${founder.email}`} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:bg-black/28 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400">
                <div className="section-label">Email</div>
                <div className="mt-2 break-all text-base font-black text-white sm:text-lg">{founder.email}</div>
              </a>
              <a href={`tel:${founder.phoneHref}`} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:bg-black/28 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400">
                <div className="section-label">Phone</div>
                <div className="mt-2 text-lg font-black text-white">{founder.phone}</div>
              </a>
              <Link href="/support" className="rounded-2xl border border-cyan-300/18 bg-cyan-400/8 px-4 py-4 transition hover:bg-cyan-400/13">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/65">Existing customer?</div>
                <div className="mt-2 text-lg font-black text-cyan-50">Visit Support</div>
              </Link>
            </div>
          </aside>

          <div id="contact-form" className="scroll-mt-28">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/68">What can we help with?</div>
            <h2 className="mt-3 text-3xl font-black text-white">Send a message</h2>
            <p className="mb-5 mt-3 text-sm leading-7 text-white/72">Choose a topic and product so your message arrives with the context needed for a useful reply.</p>
            <ContactForm kind="contact" />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
