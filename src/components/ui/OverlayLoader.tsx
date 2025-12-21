export default function OverlayLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-800/60 bg-slate-900/80 px-8 py-6 shadow-2xl">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-600 border-t-sky-400" />
        <p className="text-sm font-semibold text-slate-200">Working on it…</p>
      </div>
    </div>
  );
}
