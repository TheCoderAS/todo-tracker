"use client";

import { useMemo } from "react";

type HabitConsistencyCardProps = {
  days: number;
  completed: number;
  scheduled: number;
  completionRate: number;
  loading: boolean;
};

export default function HabitConsistencyCard({
  days,
  completed,
  scheduled,
  completionRate,
  loading
}: HabitConsistencyCardProps) {
  const statusMessage = useMemo(() => {
    if (scheduled <= 0) return "No scheduled sessions yet.";
    if (completionRate >= 85) return "Excellent consistency.";
    if (completionRate >= 65) return "Solid consistency.";
    if (completionRate >= 45) return "Keep building consistency.";
    return "Let’s reset the rhythm.";
  }, [completionRate, scheduled]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-950/70 to-sky-950/30 p-6 shadow-[0_0_30px_rgba(56,189,248,0.12)]">
      <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-sky-400/20 blur-3xl" />
      <p className="text-xs uppercase text-sky-200/80">Consistency score</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-4xl font-semibold text-white">
            {completionRate}%
          </p>
          <p className="mt-2 text-sm font-medium text-sky-100/80">
            {statusMessage}
          </p>
          <p className="mt-3 text-xs text-slate-400">
            Based on scheduled sessions over the last {days} days.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase text-slate-400">Completed</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {completed}
            <span className="text-sm text-slate-400"> / {scheduled}</span>
          </p>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Consistency reflects how often you hit scheduled sessions. Streaks only
        track consecutive wins.
      </p>
      {loading ? (
        <p className="mt-3 text-xs uppercase text-slate-500">Updating...</p>
      ) : null}
    </div>
  );
}
