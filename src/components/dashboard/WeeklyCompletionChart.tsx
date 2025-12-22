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
  const total = useMemo(() => {
    return Math.max(1, onTime + spillover);
  }, [onTime, spillover]);
  const onTimePercent = Math.round((onTime / total) * 100);
  const spilloverPercent = Math.round((spillover / total) * 100);
  const donutStyle = useMemo(() => {
    const onTimeAngle = Math.round((onTime / total) * 360);
    return {
      background: `conic-gradient(from 180deg, rgba(16,185,129,0.95) 0deg ${onTimeAngle}deg, rgba(244,63,94,0.9) ${onTimeAngle}deg 360deg)`
    };
  }, [onTime, total]);

  return (
    <div className="group rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_0_30px_rgba(15,23,42,0.35)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
        Today&apos;s completions
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-6">
        <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 shadow-[0_0_25px_rgba(59,130,246,0.2)] transition-transform duration-700 group-hover:scale-[1.02]" style={donutStyle}>
          <div className="flex h-[72%] w-[72%] flex-col items-center justify-center rounded-full bg-slate-950 text-center">
            <span className="text-2xl font-semibold text-white">{onTime + spillover}</span>
            <span className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-400">
              Total
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4 text-sm text-slate-300">
          <div>
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
              <span>On-time</span>
              <span>{onTimePercent}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-900/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-200 transition-all duration-700"
                style={{ width: `${onTimePercent}%` }}
              />
            </div>
            <p className="mt-2 text-sm font-semibold text-white">{onTime}</p>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
              <span>Spillover</span>
              <span>{spilloverPercent}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-900/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-200 transition-all duration-700"
                style={{ width: `${spilloverPercent}%` }}
              />
            </div>
            <p className="mt-2 text-sm font-semibold text-white">{spillover}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
