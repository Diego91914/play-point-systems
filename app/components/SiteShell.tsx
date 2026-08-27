"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type SiteShellProps = {
  children: ReactNode;
  current?: "home" | "games" | "live" | "shot-caddy" | "music" | "about" | "contact";
  showAccessNotice?: boolean;
};

const navItems = [
  { label: "Games", href: "/games", key: "games" },
  { label: "Live Games", href: "/live", key: "live" },
  { label: "Music", href: "/music", key: "music" },
  { label: "About", href: "/about", key: "about" },
  { label: "Contact", href: "/contact", key: "contact" },
] as const;

export function SiteShell({ children, current, showAccessNotice = false }: SiteShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAccessBanner, setShowAccessBanner] = useState(true);

  useEffect(() => {
    if (!mobileOpen) return;

    function closeMenu(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    window.addEventListener("keydown", closeMenu);
    return () => window.removeEventListener("keydown", closeMenu);
  }, [mobileOpen]);

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-xl transition focus:translate-y-0"
      >
        Skip to content
      </a>
      <div className="min-h-screen overflow-x-clip bg-[#030303] text-white">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(213,174,95,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_30%),linear-gradient(180deg,_#0d0d0d_0%,_#060606_50%,_#030303_100%)]" />
          <div className="absolute left-[-4%] top-[12%] h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="absolute bottom-[10%] right-[-4%] h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-2 py-3 min-[360px]:px-4 min-[360px]:py-6 sm:px-6 lg:px-8">
          <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_30px_120px_rgba(0,0,0,0.4)]">
            <header className="sticky top-4 z-50 px-4 pt-4 sm:px-6 lg:px-8">
              <div className="rounded-[28px] border border-amber-200/15 bg-[linear-gradient(180deg,rgba(8,8,8,0.96),rgba(8,8,8,0.84))] px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:px-6">
                <div className="flex items-center justify-between gap-2 min-[380px]:gap-4">
                  <Link href="/" aria-label="Play Point Systems home" className="flex min-w-0 items-center gap-2 min-[380px]:gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-amber-200/20 bg-black shadow-[0_0_24px_rgba(213,174,95,0.18)] sm:hidden">
                      <Image
                        src="/images/brand/play-point-systems-emblem.png"
                        alt=""
                        fill
                        priority
                        sizes="44px"
                        className="object-contain"
                      />
                    </div>
                    <div className="min-w-0 sm:hidden">
                      <div className="hidden truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-white/72 min-[380px]:block">Games · Live · Music</div>
                      <div className="whitespace-nowrap text-[13px] font-extrabold tracking-[0.005em] text-white min-[380px]:mt-1 min-[380px]:text-base sm:text-xl">Play Point Systems</div>
                    </div>
                    <div className="relative hidden h-[54px] w-[232px] shrink-0 sm:block">
                      <Image
                        src="/images/brand/play-point-systems-logo.png"
                        alt=""
                        fill
                        priority
                        sizes="232px"
                        className="object-contain"
                      />
                    </div>
                  </Link>

                  <div className="hidden items-center gap-2 lg:flex">
                    <nav aria-label="Primary navigation" className="flex flex-wrap gap-1.5 text-sm font-semibold text-white/84">
                      {navItems.map((item) => {
                        const active = current === item.key || (item.key === "games" && current === "shot-caddy");
                        const className = active
                          ? "rounded-full border border-amber-200/35 bg-amber-300/12 px-4 py-2 text-amber-50"
                          : "rounded-full border border-white/15 bg-black/20 px-4 py-2 transition hover:border-white/25 hover:bg-white/8 hover:text-white";

                        return (
                          <Link key={item.label} href={item.href} className={className} aria-current={active ? "page" : undefined}>
                            {item.label}
                          </Link>
                        );
                      })}
                    </nav>

                    <Link
                      href="/live/quick-score"
                      className="inline-flex rounded-full border border-amber-200/40 bg-[linear-gradient(120deg,rgba(224,188,111,0.34),rgba(158,112,34,0.22))] px-4 py-2 text-sm font-bold text-white shadow-[0_8px_22px_rgba(205,157,66,0.18)] transition hover:brightness-110"
                    >
                      Start Scoring
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileOpen((value) => !value)}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-white/5 text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 lg:hidden"
                    aria-expanded={mobileOpen}
                    aria-controls="mobile-navigation"
                    aria-label="Toggle navigation menu"
                  >
                    <span className="text-lg leading-none">{mobileOpen ? "×" : "≡"}</span>
                  </button>
                </div>

                {mobileOpen ? (
                  <div id="mobile-navigation" className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-3 lg:hidden">
                    <nav aria-label="Mobile navigation" className="grid gap-2 text-sm font-semibold text-white/80">
                      {navItems.map((item) => {
                        const active = current === item.key || (item.key === "games" && current === "shot-caddy");
                        const className = active
                          ? "rounded-2xl border border-amber-200/30 bg-amber-300/10 px-4 py-3 text-amber-50"
                          : "rounded-2xl border border-white/10 px-4 py-3 transition hover:bg-white/5";

                        return (
                          <Link key={item.label} href={item.href} className={className} aria-current={active ? "page" : undefined} onClick={() => setMobileOpen(false)}>
                            {item.label}
                          </Link>
                        );
                      })}
                      <Link
                        href="/live/quick-score"
                        className="rounded-2xl border border-amber-200/30 bg-amber-300/10 px-4 py-3 text-amber-50"
                        onClick={() => setMobileOpen(false)}
                      >
                        Start Scoring
                      </Link>
                    </nav>
                  </div>
                ) : null}
              </div>
            </header>

            <main id="main-content" tabIndex={-1} className="px-1 pb-1 outline-none sm:px-2 sm:pb-2">{children}</main>

            <footer className="border-t border-white/10 px-5 py-8 sm:px-8 lg:px-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Image
                    src="/images/brand/play-point-systems-logo.png"
                    alt="Play Point Systems"
                    width={1496}
                    height={376}
                    sizes="220px"
                    className="h-auto w-[220px] max-w-full"
                  />
                  <div className="mt-2 max-w-md text-sm leading-7 text-white/52">The parent company for Play Point Live, Shot Caddy, and Play Point Records. Creator-led, purpose-built, and honest about the work.</div>
                </div>
                <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-1.5">
                  <Link href="/games" className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white/72 transition hover:border-white/22 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40">
                    Games
                  </Link>
                  <Link href="/live" className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white/72 transition hover:border-white/22 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40">
                    Live Games
                  </Link>
                  <Link href="/shot-caddy" className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white/72 transition hover:border-white/22 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40">
                    Shot Caddy
                  </Link>
                  <Link href="/music" className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white/72 transition hover:border-white/22 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40">
                    Music
                  </Link>
                  <Link href="/about" className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white/72 transition hover:border-white/22 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40">
                    About
                  </Link>
                  <Link href="/contact" className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:border-amber-300/35 hover:bg-amber-300/16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300">
                    Contact
                  </Link>
                </nav>
              </div>
              <div className="mt-6 flex flex-col gap-3 border-t border-white/8 pt-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
                <div>© {new Date().getFullYear()} Play Point Systems LLC · Built by Channing Stovall</div>
                <nav aria-label="Legal and support" className="flex flex-wrap gap-4">
                  <Link href="/support" className="transition hover:text-white">Support</Link>
                  <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
                  <Link href="/terms" className="transition hover:text-white">Terms</Link>
                </nav>
              </div>
            </footer>
          </div>

          {showAccessNotice && showAccessBanner ? (
            <div className="fixed bottom-5 right-5 z-[80] w-[min(92vw,440px)] rounded-2xl border border-amber-300/35 bg-[linear-gradient(160deg,rgba(120,64,0,0.92),rgba(32,18,0,0.96))] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200/85">Access Notice</div>
                  <div className="mt-1 text-sm leading-6 text-amber-50">
                    Some Shot Caddy gameplay links are temporarily paused while access updates are completed.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAccessBanner(false)}
                  className="shrink-0 rounded-lg border border-amber-200/30 bg-amber-100/10 px-2 py-1 text-xs font-semibold text-amber-100 transition hover:bg-amber-100/20"
                  aria-label="Dismiss access notice"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
