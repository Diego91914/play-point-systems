import Link from "next/link";
import type { ReactNode } from "react";

type SiteShellProps = {
  children: ReactNode;
  current?: "home" | "shot-caddy" | "music" | "about" | "contact";
};

const navItems = [
  { label: "Home", href: "/", key: "home" },
  { label: "Shot Caddy", href: "/shot-caddy", key: "shot-caddy" },
  { label: "Music", href: "/music", key: "music" },
  { label: "About", href: "/about", key: "about" },
  { label: "Contact", href: "/contact", key: "contact" },
] as const;

export function SiteShell({ children, current }: SiteShellProps) {
  return (
    <main className="min-h-screen bg-[#050912] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(121,171,255,0.2),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(116,243,204,0.12),_transparent_28%),linear-gradient(180deg,_#09111d_0%,_#050912_48%,_#04070d_100%)]" />
        <div className="absolute left-[-4%] top-[12%] h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute bottom-[10%] right-[-4%] h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_30px_120px_rgba(0,0,0,0.4)]">
          <header className="border-b border-white/10 px-5 py-5 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/52">Play Point Systems LLC</div>
                <div className="mt-2 text-2xl font-black tracking-tight text-white">Software, music, and storytelling under one roof.</div>
              </div>

              <nav className="flex flex-wrap gap-3 text-sm font-semibold text-white/76">
                {navItems.map((item) => {
                  const active = current === item.key;
                  const className = active
                    ? "rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-cyan-50"
                    : "rounded-full border border-white/10 px-4 py-2 transition hover:bg-white/5";

                  return (
                    <Link key={item.label} href={item.href} className={className}>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </header>

          {children}

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
