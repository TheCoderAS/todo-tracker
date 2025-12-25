"use client";

import { FiArchive, FiCalendar, FiClock, FiRotateCcw, FiXCircle } from "react-icons/fi";

import type { Habit, Todo } from "@/lib/types";
import { formatDateDisplay } from "@/lib/todoFormatters";

export type MissedHabitEntry = {
  habit: Habit;
  date: Date;
  dateKey: string;
};

type ReviewPanelProps = {
  overdueTodos: Todo[];
  missedHabits: MissedHabitEntry[];
  onRescheduleTodo: (todo: Todo) => void;
  onSkipTodo: (todo: Todo) => void;
  onArchiveTodo: (todo: Todo) => void;
  onRescheduleHabit: (habit: Habit, dateKey: string) => void;
  onSkipHabit: (habit: Habit, dateKey: string) => void;
  onArchiveHabit: (habit: Habit) => void;
};

const formatHabitDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });

export default function ReviewPanel({
  overdueTodos,
  missedHabits,
  onRescheduleTodo,
  onSkipTodo,
  onArchiveTodo,
  onRescheduleHabit,
  onSkipHabit,
  onArchiveHabit
}: ReviewPanelProps) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2 rounded-3xl border border-slate-800/70 bg-slate-900/50 p-5">
        <p className="text-xs font-semibold uppercase text-slate-500">Review</p>
        <h2 className="text-lg font-semibold text-white">Catch up on what slipped</h2>
        <p className="text-sm text-slate-400">
          Reschedule, skip intentionally, or archive lingering tasks and habits.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            Overdue todos
          </h3>
          <span className="text-xs text-slate-400">{overdueTodos.length} items</span>
        </div>
        {overdueTodos.length ? (
          <div className="grid gap-3">
            {overdueTodos.map((todo) => (
              <article
                key={todo.id}
                className="grid gap-4 rounded-3xl border border-slate-800/70 bg-slate-950/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-white">{todo.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-rose-300">
                      <FiClock aria-hidden />
                      <span>{formatDateDisplay(todo.scheduledDate)}</span>
                    </div>
                  </div>
                  <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-200">
                    Overdue
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-slate-500"
                    onClick={() => onRescheduleTodo(todo)}
                  >
                    <FiRotateCcw aria-hidden />
                    Reschedule +1 day
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500"
                    onClick={() => onSkipTodo(todo)}
                  >
                    <FiXCircle aria-hidden />
                    Skip intentionally
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:border-amber-300"
                    onClick={() => onArchiveTodo(todo)}
                  >
                    <FiArchive aria-hidden />
                    Archive
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-4 text-sm text-slate-400">
            No overdue todos right now.
          </p>
        )}
      </div>

      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            Missed habit sessions
          </h3>
          <span className="text-xs text-slate-400">{missedHabits.length} items</span>
        </div>
        {missedHabits.length ? (
          <div className="grid gap-3">
            {missedHabits.map((entry) => (
              <article
                key={`${entry.habit.id}-${entry.dateKey}`}
                className="grid gap-4 rounded-3xl border border-slate-800/70 bg-slate-950/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-white">{entry.habit.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-300">
                      <FiCalendar aria-hidden className="text-slate-400" />
                      <span>Missed on {formatHabitDate(entry.date)}</span>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-800/60 px-3 py-1 text-xs font-semibold text-slate-300">
                    Missed
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-slate-500"
                    onClick={() => onRescheduleHabit(entry.habit, entry.dateKey)}
                  >
                    <FiRotateCcw aria-hidden />
                    Mark as rescheduled
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500"
                    onClick={() => onSkipHabit(entry.habit, entry.dateKey)}
                  >
                    <FiXCircle aria-hidden />
                    Skip intentionally
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:border-amber-300"
                    onClick={() => onArchiveHabit(entry.habit)}
                  >
                    <FiArchive aria-hidden />
                    Archive habit
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-4 text-sm text-slate-400">
            No missed habit sessions in the last week.
          </p>
        )}
      </div>
    </div>
  );
}
