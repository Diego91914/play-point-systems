import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[#05070b] px-5 py-12 text-white">
      <div className="mx-auto max-w-xl rounded-[32px] border border-white/10 bg-white/[0.04] p-7 text-center sm:p-9">
        <div className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/55">Play Amplified</div>
        <h1 className="mt-4 text-4xl font-black tracking-tight">You’re offline.</h1>
        <p className="mt-4 text-sm leading-7 text-white/60">
          The Play Amplified app shell is still available, but live rooms need a connection to keep every player synchronized.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Link href="/" className="rounded-2xl bg-cyan-300 px-4 py-3.5 text-sm font-black text-slate-950">TRY HOME</Link>
          <Link href="/games" className="rounded-2xl border border-white/15 px-4 py-3.5 text-sm font-black text-white">MY GAMES</Link>
        </div>
      </div>
    </main>
  );
}
