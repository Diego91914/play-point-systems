import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteShell } from "@/app/components/SiteShell";
import {
  GAMES_SESSION_COOKIE,
  verifyGamesSessionToken,
} from "@/lib/play-point-core/games-session";
import { DeleteAccountButton } from "./DeleteAccountButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account | Play Amplified",
  description: "Manage your Play Amplified account.",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function GamesAccountPage() {
  const cookieStore = await cookies();
  const claims = await verifyGamesSessionToken(cookieStore.get(GAMES_SESSION_COOKIE)?.value);
  if (!claims) redirect("/games/sign-in?next=%2Fgames%2Faccount");

  return (
    <SiteShell current="games">
      <main className="min-h-[70vh] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-3xl">
          <Link href="/games" className="text-sm font-black text-cyan-100/70 hover:text-cyan-50">
            ← Back to games
          </Link>

          <div className="mt-6 rounded-[30px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-100/55">Account</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Play Amplified account</h1>
            <p className="mt-3 text-sm leading-7 text-white/55">
              Your account is the portable identity behind your owned games. The same account can be used by the web/PWA today and native apps later.
            </p>

            <dl className="mt-7 grid gap-4 rounded-2xl border border-white/10 bg-black/15 p-5 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">Email</dt>
                <dd className="mt-1 break-all text-sm font-black text-white">{claims.email}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">Access</dt>
                <dd className="mt-1 text-sm font-black text-white">{claims.role === "founder" ? "Founder · All Access" : "Play Amplified member"}</dd>
              </div>
            </dl>

            <section className="mt-8 border-t border-white/10 pt-7">
              <h2 className="text-xl font-black text-white">Purchases & access</h2>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Owned games remain attached to this Play Amplified account rather than to one phone or browser. Native purchase restoration will connect to this same ownership layer.
              </p>
            </section>

            <section className="mt-8 border-t border-red-200/10 pt-7">
              <h2 className="text-xl font-black text-white">Delete account</h2>
              <p className="mt-2 mb-4 text-sm leading-6 text-white/50">
                Permanently delete the account and its account-linked access. You will be asked to confirm before deletion occurs.
              </p>
              <DeleteAccountButton />
            </section>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
