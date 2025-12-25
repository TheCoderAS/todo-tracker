"use client";

import { useMemo } from "react";
import { FiCalendar, FiCheckCircle, FiClock } from "react-icons/fi";

import Modal from "@/components/ui/Modal";
import { getDateKey, isHabitScheduledForDate } from "@/lib/habitUtils";
import type { Habit, HabitFrequency } from "@/lib/types";

type HabitDetailsModalProps = {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
};

type TrendEntry = {
  date: Date;
  label: string;
  dateKey: string;
  completed: boolean;
};

const getTrendStatusLabel = (habit: Habit, completed: boolean) => {
  if (habit.habitType === "avoid") {
    return completed ? "Stayed on track" : "Slipped";
  }
  return completed ? "Completed" : "Scheduled";
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

const clampDay = (year: number, monthIndex: number, day: number) => {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, lastDay);
};

const buildMonthlyOccurrences = (start: Date, step: number, count: number, day: number) => {
  const occurrences: Date[] = [];
  const base = new Date(start.getFullYear(), start.getMonth(), 1);
  for (let index = 0; index < count; index += 1) {
    const date = new Date(base);
    date.setMonth(base.getMonth() - step * index);
    const clamped = clampDay(date.getFullYear(), date.getMonth(), day);
    date.setDate(clamped);
    occurrences.push(date);
  }
  return occurrences;
};

const buildDailyOccurrences = (start: Date, count: number) => {
  return Array.from({ length: count }).map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() - index);
    return date;
  });
};

const buildYearlyOccurrences = (start: Date, count: number, month: number, day: number) => {
  const occurrences: Date[] = [];
  for (let index = 0; index < count; index += 1) {
    const year = start.getFullYear() - index;
    const date = new Date(year, month - 1, 1);
    const clamped = clampDay(date.getFullYear(), date.getMonth(), day);
    date.setDate(clamped);
    occurrences.push(date);
  }
  return occurrences;
};

const buildWeeklyOccurrences = (start: Date, count: number, days: number[]) => {
  const occurrences: Date[] = [];
  const targetDays = days.length ? days : [start.getDay()];
  let cursor = new Date(start);
  while (occurrences.length < count) {
    if (targetDays.includes(cursor.getDay())) {
      occurrences.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return occurrences;
};

const buildTrendEntries = (habit: Habit): TrendEntry[] => {
  const today = new Date();
  const dayOfMonth = habit.reminderDays?.[0] ?? today.getDate();
  const hasYearlyMonth = habit.reminderDays && habit.reminderDays.length >= 2;
  const yearlyMonth = hasYearlyMonth
    ? habit.reminderDays?.[0]
    : today.getMonth() + 1;
  const yearlyDay = hasYearlyMonth
    ? habit.reminderDays?.[1]
    : habit.reminderDays?.[0] ?? today.getDate();
  let occurrences: Date[] = [];
  if (habit.frequency === "daily") {
    occurrences = buildDailyOccurrences(today, 7);
  } else if (habit.frequency === "weekly") {
    occurrences = buildWeeklyOccurrences(today, 7, habit.reminderDays ?? []);
  } else if (habit.frequency === "monthly") {
    occurrences = buildMonthlyOccurrences(today, 1, 6, dayOfMonth);
  } else if (habit.frequency === "quarterly") {
    occurrences = buildMonthlyOccurrences(today, 3, 6, dayOfMonth);
  } else if (habit.frequency === "half-yearly") {
    occurrences = buildMonthlyOccurrences(today, 6, 4, dayOfMonth);
  } else {
    occurrences = buildYearlyOccurrences(today, 5, yearlyMonth, yearlyDay);
  }

  return occurrences
    .map((date) => {
      const dateKey = getDateKey(date, habit.timezone);
      return {
        date,
        dateKey,
        label: date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric"
        }),
        completed: habit.completionDates?.includes(dateKey) ?? false
      };
    })
    .reverse();
};

const formatHabitTypeLabel = (habit: Habit) =>
  habit.habitType === "avoid" ? "Avoid habit" : "Build habit";

export default function HabitDetailsModal({ habit, isOpen, onClose }: HabitDetailsModalProps) {
  const trendEntries = useMemo(() => (habit ? buildTrendEntries(habit) : []), [habit]);
  const totalCompletions = habit?.completionDates?.length ?? 0;
  const lastCompletion = habit?.completionDates?.length
    ? habit?.completionDates[habit.completionDates.length - 1]
    : null;
  const { rollingCompletionRate, rollingCompleted, rollingScheduled, rollingWindowDays } =
    useMemo(() => {
      const windowDays = 30;
      if (!habit) {
        return {
          rollingCompletionRate: 0,
          rollingCompleted: 0,
          rollingScheduled: 0,
          rollingWindowDays: windowDays
        };
      }

      const today = new Date();
      const dates = Array.from({ length: windowDays }).map((_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - index);
        return date;
      });
      let scheduled = 0;
      let completed = 0;

      dates.forEach((date) => {
        if (!isHabitScheduledForDate(habit, date)) return;
        scheduled += 1;
        const dateKey = getDateKey(date, habit.timezone);
        if (habit.completionDates?.includes(dateKey)) {
          completed += 1;
        }
      });

      return {
        rollingCompletionRate: scheduled ? Math.round((completed / scheduled) * 100) : 0,
        rollingCompleted: completed,
        rollingScheduled: scheduled,
        rollingWindowDays: windowDays
      };
    }, [habit]);
  const trendStatusLabel = habit
    ? (completed: boolean) => getTrendStatusLabel(habit, completed)
    : () => "";

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Habit details">
      {habit ? (
        <div className="grid gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Habit details</p>
              <h3 className="text-xl font-semibold text-white">{habit.title}</h3>
            </div>
            <span className="rounded-full border border-slate-800/70 bg-slate-950/60 px-3 py-1 text-xs font-semibold text-slate-300">
              {formatFrequencyLabel(habit.frequency)}
            </span>
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <FiClock aria-hidden className="text-emerald-300" />
              <span>
                Reminder at{" "}
                <span className="font-semibold text-slate-100">
                  {habit.reminderTime || "No time set"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FiCalendar aria-hidden className="text-sky-300" />
              <span>
                Habit type{" "}
                <span className="font-semibold text-slate-100">
                  {formatHabitTypeLabel(habit)}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FiCalendar aria-hidden className="text-sky-300" />
              <span>
                Total completions{" "}
                <span className="font-semibold text-slate-100">
                  {totalCompletions}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle aria-hidden className="text-emerald-300" />
              <span>
                Consistency (last {rollingWindowDays} days){" "}
                <span className="font-semibold text-slate-100">
                  {rollingCompletionRate}% ({rollingCompleted}/{rollingScheduled})
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FiCalendar aria-hidden className="text-sky-300" />
              <span>
                Grace misses per week{" "}
                <span className="font-semibold text-slate-100">
                  {habit.graceMisses ?? 0}
                </span>
              </span>
            </div>
            {lastCompletion ? (
              <p className="text-xs text-slate-500">
                Last completed on {lastCompletion}
              </p>
            ) : null}
            <p className="text-xs text-slate-500">
              Consistency counts scheduled sessions you hit. Streaks only track
              consecutive wins.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">Trend</h4>
              <p className="text-xs text-slate-500">Last scheduled sessions</p>
            </div>
            <div className="grid gap-2">
              {trendEntries.map((entry) => (
                <div
                  key={entry.dateKey}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 px-3 py-2"
                >
                  <span className="text-xs text-slate-300">{entry.label}</span>
                  <span
                    className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[0.65rem] font-semibold ${
                      entry.completed
                        ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-200"
                        : "border-slate-700/70 text-slate-400"
                    }`}
                  >
                    <FiCheckCircle aria-hidden className="text-[0.7rem]" />
                    {trendStatusLabel(entry.completed)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
