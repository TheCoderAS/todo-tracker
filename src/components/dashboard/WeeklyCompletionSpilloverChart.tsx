"use client";

import { useMemo, useState } from "react";

import type { WeeklyCompletionBreakdown } from "@/components/dashboard/useCompletionAnalytics";

type WeeklyCompletionSpilloverChartProps = {
  data: WeeklyCompletionBreakdown[];
};

const formatDay = (date: Date) => {
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

const periodOptions = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" }
] as const;

type PeriodValue = (typeof periodOptions)[number]["value"];

export default function WeeklyCompletionSpilloverChart({
  data
}: WeeklyCompletionSpilloverChartProps) {
  const [period, setPeriod] = useState<PeriodValue>("7");
  const visibleData = useMemo(() => {
    const days = Number(period);
    return data.slice(-days);
  }, [data, period]);
  const maxCompletion = useMemo(() => {
    return Math.max(
      1,
      ...visibleData.map((entry) => entry.onTime + entry.spillover)
    );
  }, [visibleData]);

  return (
    <div className="group rounded-3xl border border-white/10 bg-slate-950/70 p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_45px_rgba(56,189,248,0.15)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-slate-400">Task flow</p>
          <p className="text-lg font-semibold text-white">On-time vs spillover</p>
          <p className="mt-1 text-sm text-slate-300/80">
            Trend confidence grows as you keep closing tasks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold uppercase text-slate-400">
            <span className="sr-only">Select completion period</span>
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value as PeriodValue)}
              className="rounded-full border border-slate-800/70 bg-slate-950/70 px-3 py-2 text-xs text-slate-200 transition focus:border-slate-600/70 focus:outline-none focus:ring-1 focus:ring-slate-400/20"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-4 text-xs uppercase text-slate-400">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
              On-time
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-400/80" />
              Spillover
            </span>
          </div>
        </div>
      </div>
      <div className="relative mt-6">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between text-[0.65rem] text-slate-600">
          <div className="flex items-center justify-between">
            <span>{maxCompletion}</span>
            <span className="h-px flex-1 bg-white/5" />
          </div>
          <div className="flex items-center justify-between">
            <span>{Math.round(maxCompletion / 2)}</span>
            <span className="h-px flex-1 bg-white/5" />
          </div>
          <div className="flex items-center justify-between">
            <span>0</span>
            <span className="h-px flex-1 bg-white/5" />
          </div>
        </div>
        <div
          className="relative z-10 grid gap-3 pt-3"
          style={{ gridTemplateColumns: `repeat(${visibleData.length}, minmax(0, 1fr))` }}
        >
          {visibleData.map((entry) => {
            const total = entry.onTime + entry.spillover;
            const onTimeHeight = Math.max((entry.onTime / maxCompletion) * 100, 4);
            const spilloverHeight = Math.max((entry.spillover / maxCompletion) * 100, 4);
            const isEmpty = total === 0;
            return (
              <div key={entry.date.toISOString()} className="flex flex-col items-center gap-2">
                <div className="flex h-32 w-full items-end justify-center gap-2">
                  <div className="flex h-full w-4 items-end rounded-full bg-slate-900/60">
                    <div
                      className={`w-full rounded-full bg-emerald-400/80 transition-all duration-700 ${
                        isEmpty ? "opacity-30" : ""
                      }`}
                      style={{ height: `${onTimeHeight}%` }}
                      title={`${entry.onTime} on-time completions`}
                    />
                  </div>
                  <div className="flex h-full w-4 items-end rounded-full bg-slate-900/60">
                    <div
                      className={`w-full rounded-full bg-rose-400/80 transition-all duration-700 ${
                        isEmpty ? "opacity-30" : ""
                      }`}
                      style={{ height: `${spilloverHeight}%` }}
                      title={`${entry.spillover} spillover completions`}
                    />
                  </div>
                </div>
                <div className="text-xs text-slate-400">{formatDay(entry.date)}</div>
                <div className="text-[0.65rem] text-slate-500">
                  {isEmpty ? "—" : total}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
