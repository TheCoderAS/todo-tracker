"use client";

type SpilloverSummaryCardProps = {
  onTime: number;
  spillover: number;
};

export default function SpilloverSummaryCard({
  onTime,
  spillover
}: SpilloverSummaryCardProps) {
  return (
    <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-6">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
        Spillover vs On-Time
      </p>
      <div className="mt-5 grid gap-4 text-sm text-slate-300">
        <div className="flex items-center justify-between rounded-2xl border border-slate-900/80 bg-slate-900/40 px-4 py-3">
          <span>On-time completions</span>
          <span className="text-lg font-semibold text-white">{onTime}</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-slate-900/80 bg-slate-900/40 px-4 py-3">
          <span>Spillover completions</span>
          <span className="text-lg font-semibold text-white">{spillover}</span>
        </div>
      </div>
      <p className="mt-3 text-xs uppercase tracking-[0.12em] text-slate-500">
        Today&apos;s completions
      </p>
    </div>
  );
}
