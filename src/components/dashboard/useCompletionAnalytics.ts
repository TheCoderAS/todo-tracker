"use client";

import { useMemo } from "react";
import type { Timestamp } from "firebase/firestore";

import type { Todo } from "@/lib/types";

export type CompletionDay = {
  date: Date;
  count: number;
};

export type WeeklyCompletionBreakdown = {
  date: Date;
  onTime: number;
  spillover: number;
};

export type DayOfWeekStat = {
  day: string;
  count: number;
};

export type PriorityStat = {
  priority: string;
  count: number;
  total: number;
};

type CompletionAnalytics = {
  dailyCompletions: CompletionDay[];
  weeklyCompletionBreakdown: WeeklyCompletionBreakdown[];
  todayTarget: number;
  todayCompleted: number;
  onTimeCompletions: number;
  spilloverCompletions: number;
  completionByDayOfWeek: DayOfWeekStat[];
  completionByPriority: PriorityStat[];
  productivityScore: number;
  loading: boolean;
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const emptyAnalytics: CompletionAnalytics = {
  dailyCompletions: [],
  weeklyCompletionBreakdown: [],
  todayTarget: 0,
  todayCompleted: 0,
  onTimeCompletions: 0,
  spilloverCompletions: 0,
  completionByDayOfWeek: dayNames.map((day) => ({ day, count: 0 })),
  completionByPriority: [],
  productivityScore: 0,
  loading: false
};

const buildDayRange = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export function useCompletionAnalytics(
  todos: Todo[],
  isLoading: boolean
): CompletionAnalytics {
  return useMemo(() => {
    if (isLoading) return { ...emptyAnalytics, loading: true };
    if (todos.length === 0) return emptyAnalytics;

    const activeTodos = todos.filter((todo) => !todo.archivedAt);

    const today = new Date();
    const days = Array.from({ length: 30 }).map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (29 - index));
      return date;
    });

    const inRange = (timestamp: Timestamp | null, start: Date, end: Date) => {
      if (!timestamp) return false;
      const value = timestamp.toDate();
      return value >= start && value <= end;
    };

    const weeklyBreakdown = days.map((date) => {
      const { start, end } = buildDayRange(date);
      const completedTodos = activeTodos.filter(
        (todo) =>
          todo.status === "completed" && inRange(todo.completedDate, start, end)
      );

      let onTime = 0;
      let spillover = 0;
      completedTodos.forEach((todo) => {
        const scheduledDate = todo.scheduledDate?.toDate();
        if (scheduledDate && scheduledDate < start) {
          spillover += 1;
          return;
        }
        onTime += 1;
      });

      return { date: start, onTime, spillover };
    });

    const { start: todayStart, end: todayEnd } = buildDayRange(today);
    const todayTarget = activeTodos.filter(
      (todo) =>
        todo.status !== "skipped" &&
        inRange(todo.scheduledDate, todayStart, todayEnd)
    ).length;

    const todayCompletedTodos = activeTodos.filter(
      (todo) =>
        todo.status === "completed" &&
        inRange(todo.completedDate, todayStart, todayEnd)
    );

    let onTime = 0;
    let spillover = 0;
    todayCompletedTodos.forEach((todo) => {
      const scheduledDate = todo.scheduledDate?.toDate();
      if (scheduledDate && scheduledDate < todayStart) {
        spillover += 1;
        return;
      }
      onTime += 1;
    });

    const dayOfWeekCounts = new Array(7).fill(0);
    const priorityCounts: Record<string, { completed: number; total: number }> = {
      high: { completed: 0, total: 0 },
      medium: { completed: 0, total: 0 },
      low: { completed: 0, total: 0 }
    };

    activeTodos.forEach((todo) => {
      if (todo.priority && priorityCounts[todo.priority]) {
        priorityCounts[todo.priority].total += 1;
      }
      if (todo.status === "completed" && todo.completedDate) {
        const completedDate = todo.completedDate.toDate();
        dayOfWeekCounts[completedDate.getDay()] += 1;
        if (todo.priority && priorityCounts[todo.priority]) {
          priorityCounts[todo.priority].completed += 1;
        }
      }
    });

    const completionByDayOfWeek = dayNames.map((day, i) => ({
      day,
      count: dayOfWeekCounts[i]
    }));

    const completionByPriority = (["high", "medium", "low"] as const).map((p) => ({
      priority: p.charAt(0).toUpperCase() + p.slice(1),
      count: priorityCounts[p].completed,
      total: priorityCounts[p].total
    }));

    const totalCompleted = activeTodos.filter((t) => t.status === "completed").length;
    const totalTodos = activeTodos.filter((t) => t.status !== "skipped").length;
    const productivityScore =
      totalTodos > 0 ? Math.round((totalCompleted / totalTodos) * 100) : 0;

    return {
      dailyCompletions: weeklyBreakdown.map((entry) => ({
        date: entry.date,
        count: entry.onTime + entry.spillover
      })),
      weeklyCompletionBreakdown: weeklyBreakdown,
      todayCompleted:
        weeklyBreakdown[weeklyBreakdown.length - 1]
          ? weeklyBreakdown[weeklyBreakdown.length - 1].onTime +
            weeklyBreakdown[weeklyBreakdown.length - 1].spillover
          : 0,
      todayTarget,
      onTimeCompletions: onTime,
      spilloverCompletions: spillover,
      completionByDayOfWeek,
      completionByPriority,
      productivityScore,
      loading: false
    };
  }, [todos, isLoading]);
}
