"use client";

import { FiEdit2, FiPlay, FiPlus, FiTrash2 } from "react-icons/fi";

import type { Routine } from "@/lib/types";

type RoutineSectionProps = {
  routines: Routine[];
  onOpenCreate: () => void;
  onEdit: (routine: Routine) => void;
  onDelete: (routine: Routine) => void;
  onRun: (routine: Routine) => void;
  isLoading: boolean;
};

const formatPriorityLabel = (priority: string) =>
  priority.charAt(0).toUpperCase() + priority.slice(1);

export default function RoutineSection({
  routines,
  onOpenCreate,
  onEdit,
  onDelete,
  onRun,
  isLoading
}: RoutineSectionProps) {
  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-900/70 bg-gradient-to-br from-slate-900/80 via-slate-950/90 to-slate-950/80 p-5 shadow-xl shadow-slate-950/40">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">
            Routines
          </p>
          <p className="text-lg font-semibold text-white">
            {routines.length} saved routine{routines.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreate}
          className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase text-emerald-200 transition hover:border-emerald-300/80 hover:bg-emerald-400/20"
        >
          <FiPlus />
          Add routine
        </button>
      </div>
      {isLoading ? (
        <div className="rounded-3xl border border-slate-900/70 bg-slate-950/70 p-6 text-sm text-slate-400">
          Loading routines...
        </div>
      ) : routines.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800/80 bg-slate-950/70 p-6 text-sm text-slate-400">
          No routines yet. Create one to reuse your favorite task sequences.
        </div>
      ) : (
        <div className="grid gap-4">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className="rounded-3xl border border-slate-900/70 bg-slate-950/70 p-5 shadow-lg shadow-slate-950/30"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{routine.title}</h3>
                  <p className="text-xs text-slate-400">
                    {routine.items.length} template item{routine.items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onRun(routine)}
                    className="flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-400/10 px-4 py-2 text-xs font-semibold uppercase text-sky-200 transition hover:border-sky-300/80 hover:bg-sky-400/20"
                  >
                    <FiPlay />
                    Run routine
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(routine)}
                    className="rounded-full border border-slate-700/70 px-3 py-2 text-xs font-semibold uppercase text-slate-300 transition hover:border-slate-500/80 hover:text-white"
                    aria-label={`Edit ${routine.title}`}
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(routine)}
                    className="rounded-full border border-rose-500/40 px-3 py-2 text-xs font-semibold uppercase text-rose-300 transition hover:border-rose-400/80 hover:text-rose-100"
                    aria-label={`Delete ${routine.title}`}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {routine.items.length === 0 ? (
                  <p className="text-sm text-slate-500">No items saved yet.</p>
                ) : (
                  routine.items.map((item, index) => (
                    <div
                      key={`${routine.id}-item-${index}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-900/80 bg-slate-950/80 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                        <p className="text-xs text-slate-500">
                          {formatPriorityLabel(item.priority)} priority
                          {item.contextTags.length
                            ? ` • ${item.contextTags.join(", ")}`
                            : ""}
                        </p>
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.tags.length ? item.tags.join(", ") : "No tags"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
