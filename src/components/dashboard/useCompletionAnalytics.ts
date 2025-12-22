"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  collection,
  count,
  getAggregateFromServer,
  getDocs,
  query,
  Timestamp,
  where
} from "firebase/firestore";

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
    const fetchAnalytics = async () => {
      setAnalytics((prev) => ({ ...prev, loading: true }));
      try {
        const today = new Date();
        const days = Array.from({ length: 7 }).map((_, index) => {
          const date = new Date(today);
          date.setDate(today.getDate() - (6 - index));
          return date;
        });

        const completionCounts = await Promise.all(
          days.map(async (date) => {
            const { start, end } = buildDayRange(date);
            const completionQuery = query(
              collection(db, "users", user.uid, "todos"),
              where("status", "==", "completed"),
              where("completedDate", ">=", Timestamp.fromDate(start)),
              where("completedDate", "<=", Timestamp.fromDate(end))
            );
            const snapshot = await getAggregateFromServer(completionQuery, {
              count: count()
            });
            return { date: start, count: snapshot.data().count };
          })
        );

        const { start: todayStart, end: todayEnd } = buildDayRange(today);
        const todayCompletions = completionCounts[completionCounts.length - 1]?.count ?? 0;
        const targetQuery = query(
          collection(db, "users", user.uid, "todos"),
          where("scheduledDate", ">=", Timestamp.fromDate(todayStart)),
          where("scheduledDate", "<=", Timestamp.fromDate(todayEnd))
        );
        const targetSnapshot = await getAggregateFromServer(targetQuery, {
          count: count()
        });

        const todayCompletedQuery = query(
          collection(db, "users", user.uid, "todos"),
          where("status", "==", "completed"),
          where("completedDate", ">=", Timestamp.fromDate(todayStart)),
          where("completedDate", "<=", Timestamp.fromDate(todayEnd))
        );
        const todayDocs = await getDocs(todayCompletedQuery);
        let onTime = 0;
        let spillover = 0;
        todayDocs.forEach((docSnapshot) => {
          const data = docSnapshot.data() as Todo;
          const scheduledDate = data.scheduledDate?.toDate();
          if (scheduledDate && scheduledDate < todayStart) {
            spillover += 1;
            return;
          }
          onTime += 1;
        });

        if (!isMounted) return;
        setAnalytics({
          dailyCompletions: completionCounts,
          todayCompleted: todayCompletions,
          todayTarget: targetSnapshot.data().count,
          onTimeCompletions: onTime,
          spilloverCompletions: spillover,
          loading: false
        });
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setAnalytics((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return analytics;
}
