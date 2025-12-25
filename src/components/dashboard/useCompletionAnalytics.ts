"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";

import { db } from "@/lib/firebase";
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

type CompletionAnalytics = {
  dailyCompletions: CompletionDay[];
  weeklyCompletionBreakdown: WeeklyCompletionBreakdown[];
  todayTarget: number;
  todayCompleted: number;
  onTimeCompletions: number;
  spilloverCompletions: number;
  loading: boolean;
};

const emptyAnalytics: CompletionAnalytics = {
  dailyCompletions: [],
  weeklyCompletionBreakdown: [],
  todayTarget: 0,
  todayCompleted: 0,
  onTimeCompletions: 0,
  spilloverCompletions: 0,
  loading: false
};

const buildDayRange = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export function useCompletionAnalytics(user: User | null): CompletionAnalytics {
  const [analytics, setAnalytics] = useState<CompletionAnalytics>({
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

    setAnalytics((prev) => ({ ...prev, loading: true }));

    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "todos"),
      (snapshot) => {
        const todos = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...(docSnapshot.data() as Omit<Todo, "id">)
        }));

        const activeTodos = todos.filter((todo) => !todo.archivedAt);
        const weeklyBreakdown = days.map((date) => {
          const { start, end } = buildDayRange(date);
          const completedTodos = activeTodos.filter(
            (todo) => todo.status === "completed" && inRange(todo.completedDate, start, end)
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
            todo.status !== "skipped" && inRange(todo.scheduledDate, todayStart, todayEnd)
        ).length;

        const todayCompletedTodos = activeTodos.filter(
          (todo) => todo.status === "completed" && inRange(todo.completedDate, todayStart, todayEnd)
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

        if (!isMounted) return;
        setAnalytics({
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
