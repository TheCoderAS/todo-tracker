"use client";

import { useMemo } from "react";

import type { WeeklyCompletionBreakdown } from "@/components/dashboard/useCompletionAnalytics";

type WeeklyCompletionSpilloverChartProps = {
  data: WeeklyCompletionBreakdown[];
};

const formatDay = (date: Date) => {
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

export default function WeeklyCompletionSpilloverChart({
  data
}: WeeklyCompletionSpilloverChartProps) {
  const maxCompletion = useMemo(() => {
    return Math.max(
      1,
      ...data.map((entry) => entry.onTime + entry.spillover)
    );
  }, [data]);

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_0_40px_rgba(15,23,42,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Weekly completions</p>
          <p className="text-lg font-semibold text-white">On-time vs spillover</p>
          <p className="mt-1 text-sm text-slate-300/80">
            Trend confidence grows as you keep closing tasks.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-400">
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
        <div className="relative z-10 grid grid-cols-7 gap-3 pt-3">
          {data.map((entry) => {
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
