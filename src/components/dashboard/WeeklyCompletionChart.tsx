"use client";

import { useMemo } from "react";

import type { CompletionDay } from "@/components/dashboard/useCompletionAnalytics";

type WeeklyCompletionChartProps = {
  days: CompletionDay[];
};

export default function WeeklyCompletionChart({ days }: WeeklyCompletionChartProps) {
  const maxCompletion = useMemo(() => {
    return Math.max(1, ...days.map((item) => item.count));
  }, [days]);

  return (
    <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-6 lg:col-span-1 lg:row-span-2">
      <p className="text-xs tracking-[0.04em] text-slate-400">
        7-day completion trend
      </p>
      <div className="mt-6 flex h-40 items-end justify-between gap-3">
        {days.map((item) => {
          const height = (item.count / maxCompletion) * 100;
          const label = item.date.toLocaleDateString(undefined, {
            weekday: "short"
          });
          return (
            <div key={item.date.toISOString()} className="flex flex-1 flex-col">
              <div className="flex h-28 items-end justify-center">
                <div className="flex h-full w-6 items-end rounded-full bg-slate-900/60">
                  <div
                    className="w-full rounded-full bg-indigo-400/80"
                    style={{ height: `${height}%` }}
                    title={`${item.count} completed`}
                  />
                </div>
              </div>
              <div className="mt-2 text-center text-xs text-slate-400">{label}</div>
              <div className="text-center text-[0.65rem] uppercase tracking-[0.12em] text-slate-500">
                {item.count}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-slate-400">
        Aggregated completions from the last seven days.
      </p>
    </div>
  );
}
