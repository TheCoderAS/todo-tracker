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
  weeklyTrend: HabitTrendDay[];
  monthlyTrend: HabitTrendDay[];
  yearlyTrend: HabitTrendDay[];
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
  weeklyTrend: [],
  monthlyTrend: [],
  yearlyTrend: [],
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
    const last7Days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
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
            graceMisses: habit.graceMisses ?? 0
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

        if (!isMounted) return;
        setAnalytics({
          activeHabits: scheduledToday.length,
          completedToday,
          completionRate,
          weeklyTrend,
          monthlyTrend,
          yearlyTrend,
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
