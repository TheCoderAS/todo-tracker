"use client";

import { useMemo } from "react";

type WeeklyCompletionChartProps = {
  onTime: number;
  spillover: number;
};

export default function WeeklyCompletionChart({
  onTime,
  spillover
}: WeeklyCompletionChartProps) {
  const maxCompletion = useMemo(() => {
    return Math.max(1, onTime, spillover);
  }, [onTime, spillover]);

  return (
    <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-6 lg:col-span-1 lg:row-span-2">
      <p className="text-xs tracking-[0.04em] text-slate-400">Today&apos;s completions</p>
      <div className="mt-6 flex h-40 items-end justify-between gap-6">
        {[
          { label: "On-time", value: onTime, color: "bg-emerald-400/80" },
          { label: "Spillover", value: spillover, color: "bg-rose-400/80" }
        ].map((item) => {
          const height = (item.value / maxCompletion) * 100;
          return (
            <div key={item.label} className="flex flex-1 flex-col items-center">
              <div className="flex h-28 items-end justify-center">
                <div className="flex h-full w-10 items-end rounded-full bg-slate-900/60">
                  <div
                    className={`w-full rounded-full ${item.color}`}
                    style={{ height: `${height}%` }}
                    title={`${item.value} ${item.label.toLowerCase()} completions`}
                  />
                </div>
              </div>
              <div className="mt-2 text-center text-xs text-slate-400">{item.label}</div>
              <div className="text-center text-[0.65rem] text-slate-500">{item.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
