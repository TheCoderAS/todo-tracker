"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

import { db } from "@/lib/firebase";
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

const isHabitOnTrack = (habit: Habit, date: Date) => {
  const dateKey = getDateKey(date, habit.timezone);
  const isCompleted = habit.completionDates?.includes(dateKey) ?? false;
  return habit.habitType === "avoid" ? isCompleted : isCompleted;
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

export function useHabitAnalytics(user: User | null): HabitAnalytics {
  const [analytics, setAnalytics] = useState<HabitAnalytics>({
    ...emptyAnalytics,
    loading: true
  });

  useEffect(() => {
    if (!user) {
      setAnalytics(emptyAnalytics);
      return;
    }

    let isMounted = true;
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

    setAnalytics((prev) => ({ ...prev, loading: true }));

    const habitsQuery = query(
      collection(db, "users", user.uid, "habits"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      habitsQuery,
      (snapshot) => {
        const habits = snapshot.docs.map((docSnapshot) => {
          const habit = docSnapshot.data() as Omit<Habit, "id">;
          return {
            id: docSnapshot.id,
            ...habit,
            habitType: habit.habitType ?? "positive",
            graceMisses: habit.graceMisses ?? 0,
            contextTags: habit.contextTags ?? []
          };
        });

        const activeHabits = habits.filter((habit) => !habit.archivedAt);
        const scheduledToday = activeHabits.filter((habit) =>
          isHabitScheduledForDate(habit, today)
        );
        const completedToday = scheduledToday.filter((habit) =>
          isHabitOnTrack(habit, today)
        ).length;

        const weeklyTrend = last7Days.map((date) => {
          const count = activeHabits.filter(
            (habit) => isHabitScheduledForDate(habit, date) && isHabitOnTrack(habit, date)
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

        if (!isMounted) return;
        setAnalytics({
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
        });
      },
      (error) => {
        console.error(error);
        if (isMounted) {
          setAnalytics((prev) => ({ ...prev, loading: false }));
        }
      }
    );

    return () => {
      isMounted = false;
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [user]);

  return analytics;
}
