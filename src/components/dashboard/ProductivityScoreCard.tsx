type ProductivityScoreCardProps = {
  score: number;
  completionByDayOfWeek: { day: string; count: number }[];
  completionByPriority: { priority: string; count: number; total: number }[];
};

export default function ProductivityScoreCard({
  score,
  completionByDayOfWeek,
  completionByPriority
}: ProductivityScoreCardProps) {
  const maxDayCount = Math.max(...completionByDayOfWeek.map((d) => d.count), 1);
  const bestDay = completionByDayOfWeek.reduce((best, curr) =>
    curr.count > best.count ? curr : best
  );

  return (
    <div className="grid gap-4 rounded-3xl border border-slate-900/60 bg-slate-950/70 p-5 shadow-lg shadow-slate-950/40">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">
            Productivity score
          </p>
          <p className="text-3xl font-bold text-white">{score}%</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Best day</p>
          <p className="text-sm font-semibold text-emerald-300">{bestDay.day}</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-slate-400">By day of week</p>
        <div className="flex items-end gap-1.5 h-16">
          {completionByDayOfWeek.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-gradient-to-t from-sky-500 to-cyan-400 transition-all"
                style={{ height: `${Math.max((d.count / maxDayCount) * 100, 4)}%` }}
              />
              <span className="text-[0.5rem] text-slate-500">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-slate-400">By priority</p>
        <div className="grid gap-2">
          {completionByPriority.map((p) => {
            const rate = p.total > 0 ? Math.round((p.count / p.total) * 100) : 0;
            const colorMap: Record<string, string> = {
              High: "bg-rose-400",
              Medium: "bg-amber-400",
              Low: "bg-emerald-400"
            };
            return (
              <div key={p.priority} className="flex items-center gap-2">
                <span className="w-14 text-xs text-slate-400">{p.priority}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-800/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colorMap[p.priority] ?? "bg-sky-400"}`}
                    style={{ width: `${Math.max(rate, 2)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs text-slate-500">{rate}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
