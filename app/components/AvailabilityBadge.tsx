type AvailabilityStatus = "Available" | "Preview" | "Coming soon" | "Internal demo";

const styles: Record<AvailabilityStatus, string> = {
  Available: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
  Preview: "border-amber-300/25 bg-amber-400/10 text-amber-100",
  "Coming soon": "border-white/15 bg-white/5 text-white/72",
  "Internal demo": "border-violet-300/25 bg-violet-400/10 text-violet-100",
};

export function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] ${styles[status]}`}>
      {status}
    </span>
  );
}
