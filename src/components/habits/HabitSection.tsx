"use client";

import { useMemo, useState } from "react";
import { FiCheckCircle, FiCircle, FiEdit2, FiEye, FiPlus, FiTrash2 } from "react-icons/fi";

import type { Habit, HabitFrequency } from "@/lib/types";
import { getDateKey, isHabitScheduledForDate } from "@/lib/habitUtils";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type HabitSectionProps = {
  habits: Habit[];
  onToggleComplete: (habit: Habit) => void;
  onOpenCreate: () => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
  onViewDetails: (habit: Habit) => void;
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

const formatFrequencyLabel = (frequency: HabitFrequency) => {
  switch (frequency) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "quarterly":
      return "Quarterly";
    case "half-yearly":
      return "Half yearly";
    case "yearly":
      return "Yearly";
    default:
      return "Daily";
  }
};

const formatScheduleSummary = (habit: Habit) => {
  if (habit.frequency === "weekly") {
    return formatReminderDays(habit.reminderDays);
  }
  if (habit.frequency === "daily") {
    return "Every day";
  }
  if (habit.frequency === "yearly") {
    const hasMonth = habit.reminderDays && habit.reminderDays.length >= 2;
    const month = hasMonth ? habit.reminderDays?.[0] : new Date().getMonth() + 1;
    const day = hasMonth ? habit.reminderDays?.[1] : habit.reminderDays?.[0];
    if (!month || !day) return "Schedule not set";
    const date = new Date(2000, month - 1, day);
    return `${date.toLocaleDateString(undefined, { month: "long" })} ${day}`;
  }
  const dayOfMonth = habit.reminderDays?.[0];
  if (!dayOfMonth) return "Schedule not set";
  return `Day ${dayOfMonth}`;
};

export default function HabitSection({
  habits,
  onToggleComplete,
  onOpenCreate,
  onEdit,
  onDelete,
  onViewDetails,
  isLoading
}: HabitSectionProps) {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "completed" | "pending" | "archived"
  >("all");
  const [frequencyFilter, setFrequencyFilter] = useState<"all" | HabitFrequency>("all");

  const now = new Date();
  const activeHabits = useMemo(
    () => habits.filter((habit) => !habit.archivedAt),
    [habits]
  );

  const todayStats = useMemo(() => {
    const scheduledToday = activeHabits.filter((habit) =>
      isHabitScheduledForDate(habit, now)
    );
    const completed = scheduledToday.filter((habit) =>
      habit.completionDates?.includes(getDateKey(now, habit.timezone))
    ).length;
    return { total: scheduledToday.length, completed };
  }, [activeHabits, now]);

  const filteredHabits = useMemo(() => {
    return habits.filter((habit) => {
      const isArchived = Boolean(habit.archivedAt);
      const isCompletedToday = habit.completionDates?.includes(
        getDateKey(now, habit.timezone)
      );
      const isScheduledToday = isHabitScheduledForDate(habit, now);

      if (statusFilter === "archived") {
        if (!isArchived) return false;
      } else {
        if (isArchived) return false;
        if (statusFilter === "completed" && !isCompletedToday) return false;
        if (statusFilter === "pending" && isCompletedToday) return false;
        if ((statusFilter === "completed" || statusFilter === "pending") && !isScheduledToday) {
          return false;
        }
      }

      if (frequencyFilter !== "all" && habit.frequency !== frequencyFilter) {
        return false;
      }
      return true;
    });
  }, [frequencyFilter, habits, now, statusFilter]);

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

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex w-full flex-wrap items-center gap-2 rounded-full border border-slate-800/70 bg-slate-950/40 p-1 text-[0.7rem] font-semibold text-slate-200">
            {[
              { id: "all", label: "Active" },
              { id: "completed", label: "Done today" },
              { id: "pending", label: "Pending today" },
              { id: "archived", label: "Archived" }
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                className={`rounded-full px-3 py-1 transition ${
                  statusFilter === option.id
                    ? "bg-sky-400/20 text-sky-100"
                    : "text-slate-400 hover:text-white"
                }`}
                onClick={() =>
                  setStatusFilter(
                    option.id as "all" | "completed" | "pending" | "archived"
                  )
                }
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 px-2 pr-1 py-1 text-xs text-slate-200">
            <label className="flex items-center gap-2">
              <span className="text-slate-400">Frequency</span>
              <select
                value={frequencyFilter}
                onChange={(event) =>
                  setFrequencyFilter(event.target.value as "all" | HabitFrequency)
                }
                className="rounded-full border border-slate-800/70 bg-slate-950/60 px-2 py-1 text-[0.7rem] text-slate-200"
              >
                <option value="all">All</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>
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
          ) : filteredHabits.length === 0 ? (
            <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-5 text-sm text-slate-400">
              No habits match these filters.
            </div>
          ) : (
            filteredHabits.map((habit) => {
              const isCompleted = habit.completionDates?.includes(
                getDateKey(now, habit.timezone)
              );
              const isScheduledToday = isHabitScheduledForDate(habit, now);
              const isArchived = Boolean(habit.archivedAt);
              return (
                <div
                  key={habit.id}
                  className="flex flex-col gap-4 rounded-3xl border border-slate-900/60 bg-slate-950/70 p-5 shadow-lg shadow-slate-950/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="grid gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-white">
                          {habit.title}
                        </h3>
                        {isArchived ? (
                          <span className="rounded-full border border-slate-700/70 px-2 py-0.5 text-[0.6rem] font-semibold uppercase text-slate-400">
                            Archived
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-400">
                        {formatFrequencyLabel(habit.frequency)} •{" "}
                        {formatScheduleSummary(habit)} •{" "}
                        {habit.reminderTime
                          ? `Reminds at ${habit.reminderTime}`
                          : "No time"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800/70 text-slate-300 transition hover:border-slate-600/80 hover:text-white"
                        onClick={() => onViewDetails(habit)}
                        aria-label="View habit details"
                      >
                        <FiEye aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800/70 text-slate-300 transition hover:border-slate-600/80 hover:text-white"
                        onClick={() => onEdit(habit)}
                        aria-label="Edit habit"
                        disabled={isArchived}
                      >
                        <FiEdit2 aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-400/30 text-rose-200 transition hover:border-rose-300/70 hover:text-rose-100"
                        onClick={() => onDelete(habit)}
                        aria-label="Delete habit"
                      >
                        <FiTrash2 aria-hidden />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-400">
                      {isCompleted
                        ? "Completed today"
                        : isScheduledToday
                        ? "Scheduled for today"
                        : "Not scheduled today"}
                    </p>
                    {isScheduledToday ? (
                      <button
                        type="button"
                        onClick={() => onToggleComplete(habit)}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                          isCompleted
                            ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-200"
                            : "border-slate-800/70 text-slate-300 hover:border-slate-600/70 hover:text-white"
                        }`}
                        disabled={isArchived}
                      >
                        {isCompleted ? (
                          <FiCheckCircle aria-hidden className="text-emerald-300" />
                        ) : (
                          <FiCircle aria-hidden className="text-slate-500" />
                        )}
                        {isCompleted ? "Done today" : "Mark done"}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <div className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-6 z-30 flex flex-col items-end gap-3 sm:bottom-8 sm:right-10 xl:right-[calc((100vw-72rem)/2+1.5rem)]">
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
