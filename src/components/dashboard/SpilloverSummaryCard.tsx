"use client";

type SpilloverSummaryCardProps = {
  onTime: number;
  spillover: number;
};

export default function SpilloverSummaryCard({
  onTime,
  spillover
}: SpilloverSummaryCardProps) {
  const total = Math.max(1, onTime + spillover);
  const onTimePercent = Math.round((onTime / total) * 100);
  const spilloverPercent = Math.round((spillover / total) * 100);

  return (
    <div className="group rounded-3xl border border-white/10 bg-slate-950/70 p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(56,189,248,0.15)]">
      <p className="text-xs uppercase text-slate-400">
        On-time vs Spillover
      </p>
      <p className="mt-2 text-sm text-slate-300/80">
        Keep completions on schedule to protect tomorrow.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-slate-950/70 to-transparent p-4 transition-all duration-500 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]">
          <p className="text-xs uppercase text-emerald-200/80">
            On-time
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">{onTime}</p>
          <p className="mt-1 text-xs text-emerald-100/70">
            {onTimePercent}% of completions
          </p>
        </div>
        <div className="rounded-2xl border border-rose-400/20 bg-gradient-to-br from-rose-500/10 via-slate-950/70 to-transparent p-4 transition-all duration-500 hover:shadow-[0_0_25px_rgba(244,63,94,0.2)]">
          <p className="text-xs uppercase text-rose-200/80">
            Spillover
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">{spillover}</p>
          <p className="mt-1 text-xs text-rose-100/70">
            {spilloverPercent}% of completions
          </p>
        </div>
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs uppercase text-slate-400">
          <span>Balance</span>
          <span>{onTimePercent}% on-time</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-900/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-200 transition-all duration-700"
            style={{ width: `${onTimePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
