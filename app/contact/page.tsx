import type { Metadata } from "next";
import { SiteShell } from "../components/SiteShell";
import { founder } from "../site-content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Play Point Systems through founder Channing Stovall.",
};

const inquiryTypes = [
  "Private product and launch conversations",
  "Play Point Records and music inquiries",
  "Parent-company partnerships or business questions",
];

export default function ContactPage() {
  return (
    <SiteShell current="contact">
      <section className="border-b border-white/10 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <div className="max-w-4xl">
          <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
            Contact
          </div>
          <h1 className="mt-5 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">Reach the founder directly.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/76 sm:text-xl">
            For private product, music, or broader Play Point Systems conversations, the cleanest contact lane right now is directly through {founder.name}.
          </p>
        </div>
      </section>

      <section className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.08),rgba(255,255,255,0.03))] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Founder contact</div>
            <div className="mt-4 text-4xl font-black text-white">{founder.name}</div>
            <div className="mt-3 text-2xl font-semibold text-white/86">{founder.contactTitle}</div>
            <div className="mt-2 text-lg font-semibold text-white/62">{founder.company}</div>

            <div className="mt-6 grid gap-4">
              <a href={`mailto:${founder.email}`} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:bg-black/28">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Email</div>
                <div className="mt-2 text-lg font-black text-white">{founder.email}</div>
              </a>
              <a href={`tel:${founder.phoneHref}`} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:bg-black/28">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Phone</div>
                <div className="mt-2 text-lg font-black text-white">{founder.phone}</div>
              </a>
              <a href="https://playpointsystems.com" target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:bg-black/28">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Website</div>
                <div className="mt-2 text-lg font-black text-white">{founder.websiteLabel}</div>
              </a>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Best reasons to reach out</div>
            <div className="mt-4 grid gap-3">
              {inquiryTypes.map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/82">
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm leading-7 text-white/72">
              Right now the contact experience should feel personal and direct, not hidden behind generic departmental forms that do not match the size or tone of the company.
            </p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
