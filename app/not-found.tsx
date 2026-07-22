import Link from "next/link";
import { SiteShell } from "./components/SiteShell";

export default function NotFound() {
  return (
    <SiteShell>
      <section className="px-5 py-20 text-center sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/65">404 · Page not found</div>
          <h1 className="mt-5 text-5xl font-black tracking-tight text-white sm:text-6xl">That page is out of play.</h1>
          <p className="mt-5 text-base leading-8 text-white/72">The link may be outdated, or the page may have moved. Choose a destination below to get back on track.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="inline-flex items-center justify-center rounded-2xl border border-cyan-200/30 bg-cyan-400/12 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/18">Go Home</Link>
            <Link href="/games" className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12">Explore Products</Link>
            <Link href="/support" className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-black/20 px-5 py-3 text-sm font-black text-white transition hover:bg-black/28">Get Support</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
