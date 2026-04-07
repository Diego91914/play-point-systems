"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

type SiteShellProps = {
  children: ReactNode;
  current?: "home" | "shot-caddy" | "music" | "about" | "contact";
};

const navItems = [
  { label: "Shot Caddy", href: "/shot-caddy", key: "shot-caddy" },
  { label: "Music", href: "/music", key: "music" },
  { label: "About", href: "/about", key: "about" },
  { label: "Contact", href: "/contact", key: "contact" },
] as const;

export function SiteShell({ children, current }: SiteShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#050912] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(121,171,255,0.2),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(116,243,204,0.12),_transparent_28%),linear-gradient(180deg,_#09111d_0%,_#050912_48%,_#04070d_100%)]" />
        <div className="absolute left-[-4%] top-[12%] h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute bottom-[10%] right-[-4%] h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_30px_120px_rgba(0,0,0,0.4)]">
          <header className="sticky top-4 z-50 px-4 pt-4 sm:px-6 lg:px-8">
            <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,15,28,0.92),rgba(8,15,28,0.72))] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="relative flex h-14 w-[4.9rem] items-center justify-center sm:h-16 sm:w-[5.8rem]">
                    <div className="absolute inset-0 rounded-[22px] bg-white/[0.03] blur-[1px]" />
                    <Image
                      src="/images/pps-logo.png"
                      alt="Play Point Systems logo"
                      width={260}
                      height={180}
                      className="relative h-auto w-full object-contain drop-shadow-[0_6px_18px_rgba(255,255,255,0.08)]"
                      priority
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">Parent company</div>
                    <div className="mt-1 truncate text-base font-black tracking-[0.01em] text-white sm:text-xl">Play Point Systems</div>
                  </div>
                </Link>

                <div className="hidden items-center gap-3 lg:flex">
                  <nav className="flex flex-wrap gap-2 text-sm font-semibold text-white/76">
                    {navItems.map((item) => {
                      const active = current === item.key;
                      const className = active
                        ? "rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-cyan-50"
                        : "rounded-full border border-white/10 px-4 py-2 transition hover:bg-white/5 hover:text-white";

                      return (
                        <Link key={item.label} href={item.href} className={className}>
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>

                  <Link
                    href="/shot-caddy"
                    className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/12 px-4 py-2 text-sm font-bold text-cyan-50 transition hover:bg-cyan-400/18"
                  >
                    Explore Shot Caddy
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileOpen((value) => !value)}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
                  aria-expanded={mobileOpen}
                  aria-label="Toggle navigation menu"
                >
                  <span className="text-xl leading-none">{mobileOpen ? "×" : "≡"}</span>
                </button>
              </div>

              {mobileOpen ? (
                <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-3 lg:hidden">
                  <nav className="grid gap-2 text-sm font-semibold text-white/80">
                    {navItems.map((item) => {
                      const active = current === item.key;
                      const className = active
                        ? "rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-cyan-50"
                        : "rounded-2xl border border-white/10 px-4 py-3 transition hover:bg-white/5";

                      return (
                        <Link key={item.label} href={item.href} className={className} onClick={() => setMobileOpen(false)}>
                          {item.label}
                        </Link>
                      );
                    })}
                    <Link
                      href="/shot-caddy"
                      className="rounded-2xl border border-cyan-300/30 bg-cyan-400/12 px-4 py-3 text-cyan-50"
                      onClick={() => setMobileOpen(false)}
                    >
                      Explore Shot Caddy
                    </Link>
                  </nav>
                </div>
              ) : null}
            </div>
          </header>

          <div className="px-1 pb-1 sm:px-2 sm:pb-2">{children}</div>

          <footer className="border-t border-white/10 px-5 py-6 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-4 text-sm text-white/56 sm:flex-row sm:items-center sm:justify-between">
              <div>Play Point Systems is the umbrella. Shot Caddy and Play Point Records carry their own identity underneath it.</div>
              <div className="flex flex-wrap gap-4 text-white/72">
                <Link href="/shot-caddy" className="transition hover:text-white">
                  Shot Caddy
                </Link>
                <Link href="/music" className="transition hover:text-white">
                  Music
                </Link>
                <Link href="/contact" className="transition hover:text-white">
                  Contact
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
