"use client";

import { useMemo } from "react";
import { FiCheckCircle, FiCircle, FiPlus } from "react-icons/fi";

import type { Habit } from "@/lib/types";
import { getDateKey } from "@/lib/habitUtils";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type HabitSectionProps = {
  habits: Habit[];
  onToggleComplete: (habit: Habit) => void;
  onOpenCreate: () => void;
  isLoading: boolean;
};

const formatReminderDays = (days: number[]) => {
  if (!days.length) return "No days selected";
  if (days.length === 7) return "Every day";
  return days
    .sort((a, b) => a - b)
    .map((day) => dayLabels[day])
    .join(", ");
};

export default function HabitSection({
  habits,
  onToggleComplete,
  onOpenCreate,
  isLoading
}: HabitSectionProps) {
  const todayStats = useMemo(() => {
    const now = new Date();
    const completed = habits.filter((habit) =>
      habit.completionDates?.includes(getDateKey(now, habit.timezone))
    ).length;
    return { total: habits.length, completed };
  }, [habits]);

  const now = new Date();

  return (
    <section className="grid gap-6">
      <section className="grid gap-5">
        <div className="grid gap-4 rounded-3xl border border-slate-900/70 bg-gradient-to-br from-slate-900/80 via-slate-950/90 to-slate-950/80 p-5 shadow-xl shadow-slate-950/40">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">
                Today progress
              </p>
              <p className="text-lg font-semibold text-white">
                {todayStats.completed}/{todayStats.total} habits completed
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-1 text-sky-200">
                {todayStats.total
                  ? Math.round((todayStats.completed / todayStats.total) * 100)
                  : 0}
                %
              </span>
              <span className="text-slate-400">on track</span>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 transition-all"
              style={{
                width: `${Math.max(
                  todayStats.total
                    ? Math.round((todayStats.completed / todayStats.total) * 100)
                    : 0,
                  8
                )}%`
              }}
            />
          </div>
        </div>

        <div className="grid gap-3">
          {isLoading ? (
            <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-5 text-sm text-slate-400">
              Loading habits...
            </div>
          ) : habits.length === 0 ? (
            <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-5 text-sm text-slate-400">
              No habits yet. Add one with the + button.
            </div>
          ) : (
            habits.map((habit) => {
              const todayKey = getDateKey(now, habit.timezone);
              const isCompleted = habit.completionDates?.includes(todayKey);
              return (
                <div
                  key={habit.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-900/60 bg-slate-950/70 p-5 shadow-lg shadow-slate-950/40"
                >
                  <div className="grid gap-1">
                    <h3 className="text-base font-semibold text-white">{habit.title}</h3>
                    <p className="text-xs text-slate-400">
                      {formatReminderDays(habit.reminderDays)} •{" "}
                      {habit.reminderTime ? `Reminds at ${habit.reminderTime}` : "No time"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleComplete(habit)}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                      isCompleted
                        ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-200"
                        : "border-slate-800/70 text-slate-300 hover:border-slate-600/70 hover:text-white"
                    }`}
                  >
                    {isCompleted ? (
                      <FiCheckCircle aria-hidden className="text-emerald-300" />
                    ) : (
                      <FiCircle aria-hidden className="text-slate-500" />
                    )}
                    {isCompleted ? "Done today" : "Mark done"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>

      <div className="fixed bottom-24 right-6 z-30 flex flex-col items-end gap-3 sm:bottom-8">
        <button
          type="button"
          className="glow-emerald flex h-14 w-14 items-center justify-center rounded-full bg-sky-400 text-3xl font-semibold text-slate-950 shadow-xl shadow-slate-950/40 transition hover:scale-[1.02] hover:bg-sky-300"
          onClick={onOpenCreate}
          aria-label="Add habit"
        >
          <FiPlus aria-hidden />
        </button>
      </div>
    </section>
  );
}
