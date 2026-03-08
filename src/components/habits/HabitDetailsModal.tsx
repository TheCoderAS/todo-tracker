"use client";

import { useMemo } from "react";
import { FiCalendar, FiCheckCircle, FiClock, FiTrendingUp, FiZap } from "react-icons/fi";

import Modal from "@/components/ui/Modal";
import { getDateKey } from "@/lib/habitUtils";
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

const computeStreak = (habit: Habit): { current: number; longest: number } => {
  const completionSet = new Set(habit.completionDates ?? []);
  if (completionSet.size === 0) return { current: 0, longest: 0 };

  const sorted = Array.from(completionSet).sort();
  let current = 0;
  let longest = 0;
  let streak = 0;

  const cursor = new Date();
  const todayKey = getDateKey(cursor, habit.timezone);
  const yesterdayDate = new Date(cursor);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = getDateKey(yesterdayDate, habit.timezone);

  if (completionSet.has(todayKey) || completionSet.has(yesterdayKey)) {
    const start = completionSet.has(todayKey) ? cursor : yesterdayDate;
    const c = new Date(start);
    while (completionSet.has(getDateKey(c, habit.timezone))) {
      current++;
      c.setDate(c.getDate() - 1);
    }
  }

  streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T12:00:00");
    const curr = new Date(sorted[i] + "T12:00:00");
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      streak++;
    } else {
      if (streak > longest) longest = streak;
      streak = 1;
    }
  }
  if (streak > longest) longest = streak;

  return { current, longest };
};

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

const buildHeatmapData = (habit: Habit) => {
  const completionSet = new Set(habit.completionDates ?? []);
  const today = new Date();
  const weeks: { date: Date; dateKey: string; completed: boolean }[][] = [];

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 90);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  let currentWeek: { date: Date; dateKey: string; completed: boolean }[] = [];
  const cursor = new Date(startDate);

  while (cursor <= today) {
    const dateKey = getDateKey(new Date(cursor), habit.timezone);
    currentWeek.push({
      date: new Date(cursor),
      dateKey,
      completed: completionSet.has(dateKey)
    });
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
};

export default function HabitDetailsModal({ habit, isOpen, onClose }: HabitDetailsModalProps) {
  const trendEntries = useMemo(() => (habit ? buildTrendEntries(habit) : []), [habit]);
  const totalCompletions = habit?.completionDates?.length ?? 0;
  const lastCompletion = habit?.completionDates?.length
    ? habit?.completionDates[habit.completionDates.length - 1]
    : null;

  const streaks = useMemo(() => (habit ? computeStreak(habit) : { current: 0, longest: 0 }), [habit]);
  const heatmapWeeks = useMemo(() => (habit ? buildHeatmapData(habit) : []), [habit]);

  const completionRate = useMemo(() => {
    if (!trendEntries.length) return 0;
    const completed = trendEntries.filter((e) => e.completed).length;
    return Math.round((completed / trendEntries.length) * 100);
  }, [trendEntries]);

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

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-3 text-center">
              <p className="text-lg font-bold text-emerald-300">{streaks.current}</p>
              <p className="text-[0.65rem] text-slate-500 uppercase">Current streak</p>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-3 text-center">
              <p className="text-lg font-bold text-sky-300">{streaks.longest}</p>
              <p className="text-[0.65rem] text-slate-500 uppercase">Best streak</p>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-3 text-center">
              <p className="text-lg font-bold text-amber-300">{totalCompletions}</p>
              <p className="text-[0.65rem] text-slate-500 uppercase">Total</p>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-3 text-center">
              <p className="text-lg font-bold text-cyan-300">{completionRate}%</p>
              <p className="text-[0.65rem] text-slate-500 uppercase">Rate</p>
            </div>
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
            {lastCompletion ? (
              <div className="flex items-center gap-2">
                <FiCalendar aria-hidden className="text-sky-300" />
                <span>
                  Last completed{" "}
                  <span className="font-semibold text-slate-100">{lastCompletion}</span>
                </span>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3">
            <div className="flex items-center gap-2">
              <FiZap aria-hidden className="text-emerald-300 h-4 w-4" />
              <h4 className="text-sm font-semibold text-white">Activity (last 90 days)</h4>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 overflow-x-auto">
              <div className="flex gap-0.5 min-w-fit">
                <div className="flex flex-col gap-0.5 mr-1">
                  {dayLabels.map((label, i) => (
                    <div key={i} className="h-3 w-3 flex items-center justify-center text-[0.45rem] text-slate-500">
                      {i % 2 === 0 ? label : ""}
                    </div>
                  ))}
                </div>
                {heatmapWeeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-0.5">
                    {week.map((day) => (
                      <div
                        key={day.dateKey}
                        className={`h-3 w-3 rounded-sm transition ${
                          day.completed
                            ? "bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.4)]"
                            : "bg-slate-800/60"
                        }`}
                        title={`${day.date.toLocaleDateString()} - ${day.completed ? "Completed" : "Missed"}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 mt-2 text-[0.55rem] text-slate-500">
                <span>Less</span>
                <div className="h-3 w-3 rounded-sm bg-slate-800/60" />
                <div className="h-3 w-3 rounded-sm bg-emerald-400" />
                <span>More</span>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiTrendingUp aria-hidden className="text-sky-300 h-4 w-4" />
                <h4 className="text-sm font-semibold text-white">Recent trend</h4>
              </div>
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
                    {entry.completed ? "Completed" : "Scheduled"}
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
