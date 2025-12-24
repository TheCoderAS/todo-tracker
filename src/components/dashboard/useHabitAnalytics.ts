"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getDateKey } from "@/lib/habitUtils";
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
  loading: boolean;
};

const emptyAnalytics: HabitAnalytics = {
  activeHabits: 0,
  completedToday: 0,
  completionRate: 0,
  weeklyTrend: [],
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

    setAnalytics((prev) => ({ ...prev, loading: true }));

    const habitsQuery = query(
      collection(db, "users", user.uid, "habits"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      habitsQuery,
      (snapshot) => {
        const habits = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...(docSnapshot.data() as Omit<Habit, "id">)
        }));

        const activeHabits = habits.filter((habit) => !habit.archivedAt);
        const completedToday = activeHabits.filter((habit) =>
          habit.completionDates?.includes(getDateKey(today, habit.timezone))
        ).length;

        const trendCounts = last7Days.map((date) => {
          const count = habits.filter((habit) =>
            habit.completionDates?.includes(getDateKey(date, habit.timezone))
          ).length;
          return { date, count };
        });

        const completionRate = activeHabits.length
          ? Math.round((completedToday / activeHabits.length) * 100)
          : 0;

        if (!isMounted) return;
        setAnalytics({
          activeHabits: activeHabits.length,
          completedToday,
          completionRate,
          weeklyTrend: trendCounts,
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
