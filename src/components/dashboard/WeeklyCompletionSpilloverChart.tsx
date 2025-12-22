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
    <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.04em] text-slate-400">Weekly completions</p>
          <p className="text-lg font-semibold text-white">On-time vs spillover</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
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
      <div className="mt-6 grid grid-cols-7 gap-3">
        {data.map((entry) => {
          const total = entry.onTime + entry.spillover;
          const onTimeHeight = (entry.onTime / maxCompletion) * 100;
          const spilloverHeight = (entry.spillover / maxCompletion) * 100;
          return (
            <div key={entry.date.toISOString()} className="flex flex-col items-center gap-2">
              <div className="flex h-28 w-full items-end justify-center gap-2">
                <div className="flex h-full w-3 items-end rounded-full bg-slate-900/60">
                  <div
                    className="w-full rounded-full bg-emerald-400/80"
                    style={{ height: `${onTimeHeight}%` }}
                    title={`${entry.onTime} on-time completions`}
                  />
                </div>
                <div className="flex h-full w-3 items-end rounded-full bg-slate-900/60">
                  <div
                    className="w-full rounded-full bg-rose-400/80"
                    style={{ height: `${spilloverHeight}%` }}
                    title={`${entry.spillover} spillover completions`}
                  />
                </div>
              </div>
              <div className="text-xs text-slate-400">{formatDay(entry.date)}</div>
              <div className="text-[0.65rem] text-slate-500">{total}</div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-slate-400">
        Daily breakdown of completions for the last 7 days.
      </p>
    </div>
  );
}
