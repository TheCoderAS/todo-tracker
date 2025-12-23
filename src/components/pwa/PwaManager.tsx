"use client";

import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, query, Timestamp, where } from "firebase/firestore";

import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/firebase";
import type { Todo } from "@/lib/types";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

export default function PwaManager() {
  const { user } = useAuth();
  const [dueTodayTodos, setDueTodayTodos] = useState<Todo[]>([]);
  const [dayKey, setDayKey] = useState(() => new Date().toDateString());
  const notificationIntervalRef = useRef<number | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      promptEvent.prompt();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (!user) {
      setDueTodayTodos([]);
      return;
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const todosQuery = query(
      collection(db, "users", user.uid, "todos"),
      where("status", "==", "pending"),
      where("scheduledDate", ">=", Timestamp.fromDate(start)),
      where("scheduledDate", "<=", Timestamp.fromDate(end))
    );

    const unsubscribe = onSnapshot(todosQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<Todo, "id">)
      }));
      setDueTodayTodos(data);
    });

    return () => unsubscribe();
  }, [dayKey, user]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const interval = window.setInterval(() => {
      const nextKey = new Date().toDateString();
      setDayKey((prev) => (prev === nextKey ? prev : nextKey));
    }, 60 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user) return;
    if (!("Notification" in window)) return;

    const intervalMs = 5 * 60 * 1000;

    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => undefined);
    }

    const sendSummary = async () => {
      if (Notification.permission !== "granted") return;
      if (!dueTodayTodos.length) return;

      const titles = dueTodayTodos.slice(0, 3).map((todo) => todo.title);
      const remaining = dueTodayTodos.length - titles.length;
      const detail =
        remaining > 0 ? `${titles.join(", ")} +${remaining} more` : titles.join(", ");
      const title = `Due today: ${dueTodayTodos.length} task${
        dueTodayTodos.length === 1 ? "" : "s"
      }`;
      const body = detail || "Open Aura Pulse to review today's schedule.";

      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, {
          body,
          tag: "due-today-summary",
          data: { url: "/todos" }
        });
        return;
      }

      new Notification(title, { body, tag: "due-today-summary" });
    };

    if (notificationIntervalRef.current) {
      window.clearInterval(notificationIntervalRef.current);
    }

    const now = new Date();
    const elapsedMs =
      (now.getMinutes() * 60 + now.getSeconds()) * 1000 + now.getMilliseconds();
    const msUntilNextInterval = intervalMs - (elapsedMs % intervalMs);

    const timeoutId = window.setTimeout(() => {
      sendSummary().catch(() => undefined);
      notificationIntervalRef.current = window.setInterval(() => {
        sendSummary().catch(() => undefined);
      }, intervalMs);
    }, Math.max(msUntilNextInterval, 0));

    return () => {
      window.clearTimeout(timeoutId);
      if (notificationIntervalRef.current) {
        window.clearInterval(notificationIntervalRef.current);
        notificationIntervalRef.current = null;
      }
    };
  }, [dueTodayTodos, user]);

  return null;
}
