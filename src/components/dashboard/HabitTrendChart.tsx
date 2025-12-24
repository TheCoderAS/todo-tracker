"use client";

import { useMemo, useState } from "react";

import type { HabitTrendDay } from "@/components/dashboard/useHabitAnalytics";

type TrendPeriod = "weekly" | "monthly" | "yearly";

type HabitTrendChartProps = {
  weeklyTrend: HabitTrendDay[];
  monthlyTrend: HabitTrendDay[];
  yearlyTrend: HabitTrendDay[];
};

const periodOptions: { value: TrendPeriod; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" }
];

const formatLabel = (period: TrendPeriod, date: Date) => {
  if (period === "weekly") {
    return date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2);
  }
  if (period === "monthly") {
    return date.toLocaleDateString(undefined, { month: "short" });
  }
  return date.getFullYear().toString();
};

export default function HabitTrendChart({
  weeklyTrend,
  monthlyTrend,
  yearlyTrend
}: HabitTrendChartProps) {
  const [period, setPeriod] = useState<TrendPeriod>("weekly");
  const data =
    period === "weekly" ? weeklyTrend : period === "monthly" ? monthlyTrend : yearlyTrend;
  const maxCount = useMemo(() => Math.max(1, ...data.map((entry) => entry.count)), [data]);

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_0_40px_rgba(15,23,42,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-slate-400">Habit trend</p>
          <p className="text-lg font-semibold text-white">Scheduled completions</p>
          <p className="mt-1 text-sm text-slate-300/80">
            Review how consistently you&apos;re closing habits.
          </p>
        </div>
        <label className="text-xs font-semibold uppercase text-slate-400">
          <span className="sr-only">Select trend period</span>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as TrendPeriod)}
            className="rounded-full border border-slate-800/70 bg-slate-950/70 px-3 py-2 text-xs text-slate-200"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {data.length ? (
        <div className="relative mt-6">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between text-[0.65rem] text-slate-600">
            <div className="flex items-center justify-between">
              <span>{maxCount}</span>
              <span className="h-px flex-1 bg-white/5" />
            </div>
            <div className="flex items-center justify-between">
              <span>{Math.round(maxCount / 2)}</span>
              <span className="h-px flex-1 bg-white/5" />
            </div>
            <div className="flex items-center justify-between">
              <span>0</span>
              <span className="h-px flex-1 bg-white/5" />
            </div>
          </div>
          <div
            className="relative z-10 grid gap-3 pt-3"
            style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
          >
            {data.map((entry) => {
              const height = Math.max((entry.count / maxCount) * 100, 4);
              const isEmpty = entry.count === 0;
              return (
                <div key={entry.date.toISOString()} className="flex flex-col items-center gap-2">
                  <div className="flex h-32 w-full items-end justify-center">
                    <div className="flex h-full w-6 items-end rounded-full bg-slate-900/60">
                      <div
                        className={`w-full rounded-full bg-gradient-to-t from-sky-400 to-emerald-300 transition-all duration-700 ${
                          isEmpty ? "opacity-30" : ""
                        }`}
                        style={{ height: `${height}%` }}
                        title={`${entry.count} completions`}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatLabel(period, entry.date)}
                  </div>
                  <div className="text-[0.65rem] text-slate-500">
                    {isEmpty ? "—" : entry.count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-sm text-slate-400">
          No habit trend data yet.
        </div>
      )}
    </div>
  );
}
