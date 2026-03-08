"use client";

import { useMemo } from "react";

import { getDateKey, getMonthKey, isHabitScheduledForDate } from "@/lib/habitUtils";
import type { Habit } from "@/lib/types";

export type HabitTrendDay = {
  date: Date;
  count: number;
};

type HabitAnalytics = {
  activeHabits: number;
  completedToday: number;
  completionRate: number;
  rollingWindowDays: number;
  rollingWindowCompletionRate: number;
  rollingWindowCompleted: number;
  rollingWindowScheduled: number;
  weeklyTrend: HabitTrendDay[];
  monthlyTrend: HabitTrendDay[];
  yearlyTrend: HabitTrendDay[];
  completionRatesByContextTag: {
    tag: string;
    completionRate: number;
    completed: number;
    scheduled: number;
  }[];
  loading: boolean;
};

const isHabitSkipped = (habit: Habit, date: Date) => {
  const dateKey = getDateKey(date, habit.timezone);
  return habit.skippedDates?.includes(dateKey) ?? false;
};

const isHabitOnTrack = (habit: Habit, date: Date) => {
  const dateKey = getDateKey(date, habit.timezone);
  const isCompleted = habit.completionDates?.includes(dateKey) ?? false;
  if (isHabitSkipped(habit, date)) {
    return false;
  }
  return isCompleted;
};

const emptyAnalytics: HabitAnalytics = {
  activeHabits: 0,
  completedToday: 0,
  completionRate: 0,
  rollingWindowDays: 30,
  rollingWindowCompletionRate: 0,
  rollingWindowCompleted: 0,
  rollingWindowScheduled: 0,
  weeklyTrend: [],
  monthlyTrend: [],
  yearlyTrend: [],
  completionRatesByContextTag: [],
  loading: false
};

export function useHabitAnalytics(
  habits: Habit[],
  isLoading: boolean
): HabitAnalytics {
  return useMemo(() => {
    if (isLoading) return { ...emptyAnalytics, loading: true };
    if (habits.length === 0) return emptyAnalytics;

    const today = new Date();
    const rollingWindowDays = 30;
    const last7Days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return date;
    });
    const last30Days = Array.from({ length: rollingWindowDays }).map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (rollingWindowDays - 1 - index));
      return date;
    });
    const last6Months = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
      return date;
    });
    const last5Years = Array.from({ length: 5 }).map((_, index) => {
      const date = new Date(today.getFullYear() - (4 - index), 0, 1);
      return date;
    });

    const activeHabits = habits.filter((habit) => !habit.archivedAt);
    const scheduledToday = activeHabits.filter(
      (habit) => isHabitScheduledForDate(habit, today) && !isHabitSkipped(habit, today)
    );
    const completedToday = scheduledToday.filter((habit) =>
      isHabitOnTrack(habit, today)
    ).length;

    const weeklyTrend = last7Days.map((date) => {
      const count = activeHabits.filter(
        (habit) =>
          isHabitScheduledForDate(habit, date) &&
          !isHabitSkipped(habit, date) &&
          isHabitOnTrack(habit, date)
      ).length;
      return { date, count };
    });

    const monthMap = new Map(
      last6Months.map((date) => [getMonthKey(date), { date, count: 0 }])
    );
    const yearMap = new Map(
      last5Years.map((date) => [String(date.getFullYear()), { date, count: 0 }])
    );

    activeHabits.forEach((habit) => {
      habit.completionDates?.forEach((dateKey) => {
        const completionDate = new Date(`${dateKey}T00:00:00`);
        if (!isHabitScheduledForDate(habit, completionDate)) return;
        if (isHabitSkipped(habit, completionDate)) return;
        const monthKey = dateKey.slice(0, 7);
        const yearKey = dateKey.slice(0, 4);
        const monthEntry = monthMap.get(monthKey);
        if (monthEntry) {
          monthEntry.count += 1;
        }
        const yearEntry = yearMap.get(yearKey);
        if (yearEntry) {
          yearEntry.count += 1;
        }
      });
    });

    const monthlyTrend = last6Months.map(
      (date) => monthMap.get(getMonthKey(date)) ?? { date, count: 0 }
    );
    const yearlyTrend = last5Years.map(
      (date) => yearMap.get(String(date.getFullYear())) ?? { date, count: 0 }
    );

    const completionRate = scheduledToday.length
      ? Math.round((completedToday / scheduledToday.length) * 100)
      : 0;

    let rollingWindowCompleted = 0;
    let rollingWindowScheduled = 0;
    last30Days.forEach((date) => {
      activeHabits.forEach((habit) => {
        if (!isHabitScheduledForDate(habit, date)) return;
        if (isHabitSkipped(habit, date)) return;
        rollingWindowScheduled += 1;
        if (isHabitOnTrack(habit, date)) {
          rollingWindowCompleted += 1;
        }
      });
    });
    const rollingWindowCompletionRate = rollingWindowScheduled
      ? Math.round((rollingWindowCompleted / rollingWindowScheduled) * 100)
      : 0;

    const contextTagMap = new Map<
      string,
      { completed: number; scheduled: number }
    >();
    scheduledToday.forEach((habit) => {
      const tagList =
        habit.contextTags && habit.contextTags.length > 0
          ? habit.contextTags
          : ["Uncategorized"];
      tagList.forEach((tag) => {
        const entry = contextTagMap.get(tag) ?? { completed: 0, scheduled: 0 };
        entry.scheduled += 1;
        if (isHabitOnTrack(habit, today)) {
          entry.completed += 1;
        }
        contextTagMap.set(tag, entry);
      });
    });

    const completionRatesByContextTag = Array.from(contextTagMap.entries())
      .map(([tag, stats]) => ({
        tag,
        completionRate: stats.scheduled
          ? Math.round((stats.completed / stats.scheduled) * 100)
          : 0,
        completed: stats.completed,
        scheduled: stats.scheduled
      }))
      .sort((a, b) => a.tag.localeCompare(b.tag));

    return {
      activeHabits: scheduledToday.length,
      completedToday,
      completionRate,
      rollingWindowDays,
      rollingWindowCompletionRate,
      rollingWindowCompleted,
      rollingWindowScheduled,
      weeklyTrend,
      monthlyTrend,
      yearlyTrend,
      completionRatesByContextTag,
      loading: false
    };
  }, [habits, isLoading]);
}
