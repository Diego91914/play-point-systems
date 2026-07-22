import type { Metadata } from "next";
import { SiteShell } from "../components/SiteShell";
import { founder } from "../site-content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Play Point Systems collects, uses, stores, and protects information across its website and products.",
};

export default function PrivacyPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-4xl px-5 pb-14 pt-10 sm:px-8 sm:pt-12 lg:px-10 lg:pb-20 lg:pt-16">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/58">Last updated July 21, 2026</div>
        <h1 className="mt-4 text-5xl font-black tracking-tight text-white sm:text-6xl">Privacy Policy</h1>
        <p className="mt-5 text-lg leading-8 text-white/76">
          This policy explains how Play Point Systems LLC collects and uses information when you visit playpointsystems.com or use products such as Play Point Live and Quick Score.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-white/74">
          <section>
            <h2 className="text-2xl font-black text-white">Information you provide</h2>
            <p className="mt-3">Depending on the feature, you may provide player display names, team names, club and event information, match results, support messages, and contact details. Public live sessions may display names and scores to people who have the session link or code.</p>
          </section>
          <section>
            <h2 className="text-2xl font-black text-white">Device storage and technical information</h2>
            <p className="mt-3">Quick Score uses browser local storage and session storage to remember local games, player identity, and recovery information on your device. Our hosting and service providers may automatically process IP addresses, device and browser details, request logs, and similar technical information needed to deliver, secure, and troubleshoot the services.</p>
          </section>
          <section>
            <h2 className="text-2xl font-black text-white">Purchases</h2>
            <p className="mt-3">Payments are processed by Stripe. Stripe may collect payment, billing, device, and transaction information under its own privacy policy. Play Point Systems receives transaction status and reference information needed to confirm access, but does not receive or store your complete payment-card number.</p>
          </section>
          <section>
            <h2 className="text-2xl font-black text-white">How information is used</h2>
            <p className="mt-3">We use information to operate live games and scoreboards, maintain club and match history, verify purchases, provide support, secure the service, prevent misuse, improve reliability, and comply with legal obligations. We do not currently sell personal information or use advertising cookies for cross-site behavioral advertising.</p>
          </section>
          <section>
            <h2 className="text-2xl font-black text-white">Service providers</h2>
            <p className="mt-3">We use service providers including Vercel for hosting, Supabase for application data, and Stripe for payments. These providers process information on our behalf or as independent service providers according to their contracts and privacy notices.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <a href="https://stripe.com/privacy" target="_blank" rel="noreferrer" className="text-cyan-200 underline decoration-cyan-300/35 underline-offset-4">Stripe Privacy</a>
              <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer" className="text-cyan-200 underline decoration-cyan-300/35 underline-offset-4">Supabase Privacy</a>
              <a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noreferrer" className="text-cyan-200 underline decoration-cyan-300/35 underline-offset-4">Vercel Privacy</a>
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-black text-white">Retention and security</h2>
            <p className="mt-3">We retain information for as long as reasonably needed to provide the service, maintain legitimate business records, resolve disputes, and meet legal obligations. We use reasonable administrative and technical safeguards, but no online service can guarantee absolute security.</p>
          </section>
          <section>
            <h2 className="text-2xl font-black text-white">Your choices</h2>
            <p className="mt-3">You can clear local browser data through your browser settings. You may contact us to ask about access, correction, or deletion of information associated with you. We may need to verify your identity and may retain information where required for legal, security, accounting, or fraud-prevention purposes.</p>
          </section>
          <section>
            <h2 className="text-2xl font-black text-white">Children</h2>
            <p className="mt-3">The services are not directed to children under 13. If you believe a child has provided personal information without appropriate consent, contact us so we can review the request.</p>
          </section>
          <section>
            <h2 className="text-2xl font-black text-white">Contact</h2>
            <p className="mt-3">For privacy questions or requests, email <a href={`mailto:${founder.email}?subject=Privacy request`} className="font-semibold text-cyan-200 underline decoration-cyan-300/35 underline-offset-4">{founder.email}</a>.</p>
          </section>
        </div>
      </article>
    </SiteShell>
  );
}
