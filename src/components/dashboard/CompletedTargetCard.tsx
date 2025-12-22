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

  return (
    <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-6">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
        Completed vs Target
      </p>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-3xl font-semibold text-white">
            {completed}
            <span className="text-lg text-slate-400"> / {target}</span>
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {target > 0
              ? `${Math.round(progress)}% of today's plan`
              : "No tasks scheduled for today yet."}
          </p>
        </div>
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/60">
          <span className="text-lg font-semibold text-white">
            {target > 0 ? Math.round(progress) : 0}%
          </span>
        </div>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-900/70">
        <div
          className="h-full rounded-full bg-emerald-400/80 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      {loading ? (
        <p className="mt-3 text-xs uppercase tracking-[0.12em] text-slate-500">
          Updating...
        </p>
      ) : null}
    </div>
  );
}
