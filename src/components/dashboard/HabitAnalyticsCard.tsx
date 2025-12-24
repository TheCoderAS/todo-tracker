"use client";

import type { HabitTrendDay } from "@/components/dashboard/useHabitAnalytics";

type HabitAnalyticsCardProps = {
  activeHabits: number;
  completedToday: number;
  completionRate: number;
  weeklyTrend: HabitTrendDay[];
  loading: boolean;
};

export default function HabitAnalyticsCard({
  activeHabits,
  completedToday,
  completionRate,
  weeklyTrend,
  loading
}: HabitAnalyticsCardProps) {
  const maxCount = Math.max(1, ...weeklyTrend.map((entry) => entry.count));

  return (
    <div className="group rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-950/60 to-sky-950/30 p-6 shadow-[0_0_30px_rgba(14,165,233,0.12)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(56,189,248,0.2)]">
      <p className="text-xs uppercase text-slate-400">Habit momentum</p>
      <p className="mt-2 text-sm text-slate-300/80">
        {activeHabits
          ? `${completedToday} habits completed today`
          : "Add habits to start tracking progress."}
      </p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-semibold text-white">
            {completionRate}%
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {completedToday}/{activeHabits} completed today
          </p>
        </div>
        <div className="flex items-end gap-1">
          {weeklyTrend.map((entry) => {
            const height = Math.round((entry.count / maxCount) * 36);
            return (
              <div key={entry.date.toISOString()} className="flex flex-col items-center gap-1">
                <div
                  className="w-2 rounded-full bg-gradient-to-t from-sky-400 to-emerald-300"
                  style={{ height: `${Math.max(height, 6)}px` }}
                />
                <span className="text-[0.6rem] text-slate-500">
                  {entry.date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {loading ? (
        <p className="mt-3 text-xs uppercase text-slate-500">Updating...</p>
      ) : null}
    </div>
  );
}
