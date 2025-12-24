"use client";

import { useMemo } from "react";

type CompletedTargetCardProps = {
  completed: number;
  target: number;
  loading: boolean;
};

export default function CompletedTargetCard({
  completed,
  target,
  loading
}: CompletedTargetCardProps) {
  const progress = useMemo(() => {
    if (target <= 0) return 0;
    return Math.min((completed / target) * 100, 100);
  }, [completed, target]);
  const statusMessage = useMemo(() => {
    if (target <= 0) return "No tasks scheduled yet.";
    if (progress >= 100) return "Crushed today’s plan.";
    if (progress >= 75) return "Ahead of today’s plan.";
    if (progress >= 45) return "Stay on track.";
    return "Build momentum this morning.";
  }, [progress, target]);
  const badgeStyle = useMemo(() => {
    const angle = Math.round(progress * 3.6);
    return {
      background: `conic-gradient(from 210deg, rgba(16,185,129,0.95) 0deg ${angle}deg, rgba(15,23,42,0.7) ${angle}deg 360deg)`
    };
  }, [progress]);

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-950/70 to-emerald-950/30 p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_55px_rgba(16,185,129,0.2)]">
      <div className="absolute -right-12 -top-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl transition-opacity duration-500 group-hover:opacity-90" />
      <p className="text-xs uppercase text-emerald-200/70">
        Task momentum
      </p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-4xl font-semibold text-white sm:text-5xl">
            {completed}
            <span className="text-2xl text-slate-300"> / {target}</span>
          </p>
          <p className="mt-3 text-base font-medium text-emerald-100/80">
            {statusMessage}
          </p>
          <p className="mt-2 text-sm text-slate-300/80">
            {target > 0
              ? `${Math.round(progress)}% of today’s plan`
              : "Add a target to start tracking progress."}
          </p>
        </div>
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 shadow-[0_0_25px_rgba(16,185,129,0.2)]"
          style={badgeStyle}
        >
          <div className="flex h-[72%] w-[72%] items-center justify-center rounded-full bg-slate-950 text-lg font-semibold text-white">
            {target > 0 ? Math.round(progress) : 0}%
          </div>
        </div>
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs uppercase text-slate-400">
          <span>Progress</span>
          <span>{completed} done</span>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-900/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.45)] transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      {loading ? (
        <p className="mt-3 text-xs uppercase text-slate-500">
          Updating...
        </p>
      ) : null}
    </div>
  );
}
