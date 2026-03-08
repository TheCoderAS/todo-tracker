import type { WeeklyCompletionBreakdown } from "./useCompletionAnalytics";

type WeeklySummaryCardProps = {
  data: WeeklyCompletionBreakdown[];
  todayCompleted: number;
  todayTarget: number;
};

export default function WeeklySummaryCard({
  data,
  todayCompleted,
  todayTarget
}: WeeklySummaryCardProps) {
  const last7 = data.slice(-7);
  const totalCompleted = last7.reduce((sum, d) => sum + d.onTime + d.spillover, 0);
  const totalOnTime = last7.reduce((sum, d) => sum + d.onTime, 0);
  const totalSpillover = last7.reduce((sum, d) => sum + d.spillover, 0);

  const avgPerDay = last7.length > 0 ? Math.round(totalCompleted / last7.length * 10) / 10 : 0;

  const bestDay = last7.reduce((best, curr) => {
    const currTotal = curr.onTime + curr.spillover;
    const bestTotal = best.onTime + best.spillover;
    return currTotal > bestTotal ? curr : best;
  }, last7[0] ?? { date: new Date(), onTime: 0, spillover: 0 });

  const bestDayLabel = bestDay?.date
    ? bestDay.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    : "—";

  return (
    <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-5 shadow-lg shadow-slate-950/40">
      <p className="text-xs font-semibold uppercase text-slate-500 mb-1">
        Week in review
      </p>
      <p className="text-lg font-semibold text-white mb-4">
        {totalCompleted} tasks completed
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-3 text-center">
          <p className="text-lg font-bold text-emerald-300">{totalOnTime}</p>
          <p className="text-[0.6rem] text-slate-500 uppercase">On time</p>
        </div>
        <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-3 text-center">
          <p className="text-lg font-bold text-amber-300">{totalSpillover}</p>
          <p className="text-[0.6rem] text-slate-500 uppercase">Spillover</p>
        </div>
        <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-3 text-center">
          <p className="text-lg font-bold text-sky-300">{avgPerDay}</p>
          <p className="text-[0.6rem] text-slate-500 uppercase">Avg/day</p>
        </div>
        <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-3 text-center">
          <p className="text-sm font-bold text-cyan-300 truncate">{bestDayLabel}</p>
          <p className="text-[0.6rem] text-slate-500 uppercase">Best day</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-950/60 p-3">
        <span className="text-xs text-slate-400">Today</span>
        <span className="text-sm font-semibold text-white">
          {todayCompleted}/{todayTarget} completed
        </span>
      </div>
    </div>
  );
}
