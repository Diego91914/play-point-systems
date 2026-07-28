import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type ProductShellProps = {
  children: ReactNode;
  productName: string;
  heading: string;
  summary: string;
  status: "Available" | "Preview" | "Internal demo";
  backHref: string;
  backLabel: string;
  helpTitle: string;
  helpItems: readonly string[];
};

const statusClass = {
  Available: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
  Preview: "border-amber-300/25 bg-amber-400/10 text-amber-100",
  "Internal demo": "border-violet-300/25 bg-violet-400/10 text-violet-100",
} as const;

export function ProductShell({
  children,
  productName,
  heading,
  summary,
  status,
  backHref,
  backLabel,
  helpTitle,
  helpItems,
}: ProductShellProps) {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#050912] text-white">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-xl transition focus:translate-y-0"
      >
        Skip to task
      </a>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07111d]/95 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Play Point Systems home">
            <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-[#111820]">
              <Image src="/images/brand/play-point-systems-emblem.png" alt="" fill priority sizes="40px" className="object-contain" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-white sm:text-base">{productName}</span>
              <span className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-white/62 min-[380px]:block">Play Point Systems</span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <span className={`hidden rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] min-[420px]:inline-flex ${statusClass[status]}`}>
              {status}
            </span>
            <Link href={backHref} className="rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs font-black text-white/82 transition hover:bg-white/10 hover:text-white sm:text-sm">
              {backLabel}
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="outline-none">
        <section className="border-b border-white/10 px-5 py-5 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] min-[420px]:hidden ${statusClass[status]}`}>
                {status}
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">{heading}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/72">{summary}</p>
            </div>

            <details className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/72 lg:max-w-md">
              <summary className="cursor-pointer font-black text-white">{helpTitle}</summary>
              <ul className="mt-3 grid gap-2 leading-6">
                {helpItems.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </section>

        {children}
      </main>

      <footer className="border-t border-white/10 px-5 py-6 text-xs text-white/58 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <span>Play Point Systems</span>
          <nav aria-label="Product support" className="flex gap-4">
            <Link href="/support" className="transition hover:text-white">Support</Link>
            <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
            <Link href="/terms" className="transition hover:text-white">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
