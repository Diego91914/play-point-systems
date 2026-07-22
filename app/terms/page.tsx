import type { Metadata } from "next";
import { SiteShell } from "../components/SiteShell";
import { founder } from "../site-content";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms governing use of the Play Point Systems website, games, scoring products, and paid features.",
};

export default function TermsPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-4xl px-5 pb-14 pt-10 sm:px-8 sm:pt-12 lg:px-10 lg:pb-20 lg:pt-16">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/58">Effective July 21, 2026</div>
        <h1 className="mt-4 text-5xl font-black tracking-tight text-white sm:text-6xl">Terms of Use</h1>
        <p className="mt-5 text-lg leading-8 text-white/76">
          These Terms govern your use of playpointsystems.com and products offered by Play Point Systems LLC, including Play Point Live, Quick Score, and Play Point Trivia.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-white/74">
          <section>
            <h2 className="text-2xl font-black text-white">Using the services</h2>
            <p className="mt-3">You may use the services only for lawful purposes and in accordance with these Terms. You are responsible for the names, scores, event information, and other content you enter, and for making sure you have permission to share it.</p>
          </section>
          <section>
            <h2 className="text-2xl font-black text-white">Player identity and recovery information</h2>
            <p className="mt-3">Some features create a player identifier and recovery code rather than a traditional account password. You are responsible for protecting recovery information and activity performed through your identity. Contact support promptly if you believe it has been compromised.</p>
          </section>
          <section>
            <h2 className="text-2xl font-black text-white">Purchases and refunds</h2>
            <p className="mt-3">Prices and the nature of a purchase are shown before checkout. Payments are processed by Stripe. Unless otherwise stated at checkout, paid feature access is a one-time purchase for the identified product. If a purchase fails to activate or you believe a charge was made in error, contact support with the Stripe receipt or checkout reference. Refund requests are reviewed based on the circumstances and applicable law.</p>
          </section>
          <section>
            <h2 className="text-2xl font-black text-white">Acceptable use</h2>
            <p className="mt-3">You may not interfere with the services, bypass access controls, probe for vulnerabilities, automate abusive traffic, submit unlawful or harmful material, impersonate another person, or use the services in a way that harms other users or Play Point Systems.</p>
          </section>
          <section>
            <h2 className="text-2xl font-black text-white">Ownership</h2>
            <p className="mt-3">Play Point Systems and its licensors own the services, software, designs, branding, and original content. These Terms give you permission to use the services; they do not transfer ownership or grant permission to copy, resell, or create derivative commercial products from them.</p>
          </section>
          <section>
            <h2 className="text-2xl font-black text-white">Third-party services and links</h2>
            <p className="mt-3">The site may connect to third-party services such as Stripe, Supabase, streaming platforms, and external product websites. Their terms and policies govern your use of those services. Play Point Systems is not responsible for third-party content or availability.</p>
          </section>
          <section>
            <h2 className="text-2xl font-black text-white">Availability and changes</h2>
            <p className="mt-3">Features may change, pause, or be discontinued as the products develop. We may suspend access where reasonably necessary for maintenance, security, legal compliance, or misuse. We do not promise uninterrupted or error-free operation.</p>
          </section>
          <section>
            <h2 className="text-2xl font-black text-white">Disclaimers and responsibility</h2>
            <p className="mt-3">The services are provided on an “as available” basis to the fullest extent permitted by law. Play Point Systems is not responsible for indirect, incidental, or consequential losses resulting from use of the services. Nothing in these Terms limits rights or responsibilities that cannot legally be limited.</p>
          </section>
          <section>
            <h2 className="text-2xl font-black text-white">Updates to these Terms</h2>
            <p className="mt-3">We may update these Terms as products and legal requirements change. The effective date above identifies the current version. Continued use after an update means you accept the revised Terms where permitted by law.</p>
          </section>
          <section>
            <h2 className="text-2xl font-black text-white">Contact</h2>
            <p className="mt-3">Questions about these Terms, purchases, or support can be sent to <a href={`mailto:${founder.email}?subject=Terms or purchase question`} className="font-semibold text-cyan-200 underline decoration-cyan-300/35 underline-offset-4">{founder.email}</a>.</p>
          </section>
        </div>
      </article>
    </SiteShell>
  );
}
