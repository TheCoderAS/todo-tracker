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

type CompletionAnalytics = {
  dailyCompletions: CompletionDay[];
  todayTarget: number;
  todayCompleted: number;
  onTimeCompletions: number;
  spilloverCompletions: number;
  loading: boolean;
};

const emptyAnalytics: CompletionAnalytics = {
  dailyCompletions: [],
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

export function useCompletionAnalytics(
  user: User | null,
  refreshKey?: string | null
): CompletionAnalytics {
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
    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
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

        const completionCounts = days.map((date) => {
          const { start, end } = buildDayRange(date);
          const count = todos.filter(
            (todo) => todo.status === "completed" && inRange(todo.completedDate, start, end)
          ).length;
          return { date: start, count };
        });

        const { start: todayStart, end: todayEnd } = buildDayRange(today);
        const todayTarget = todos.filter((todo) =>
          inRange(todo.scheduledDate, todayStart, todayEnd)
        ).length;

        const todayCompletedTodos = todos.filter(
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
          dailyCompletions: completionCounts,
          todayCompleted: completionCounts[completionCounts.length - 1]?.count ?? 0,
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
  }, [refreshKey, user]);

  return analytics;
}
