import { useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where
} from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";

import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/firebase";
import { getFirebaseMessaging } from "@/lib/firebaseMessaging";
import type { Todo } from "@/lib/types";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

export default function PwaManager() {
  const { user } = useAuth();
  const [dueTodayTodos, setDueTodayTodos] = useState<Todo[]>([]);
  const [dayKey, setDayKey] = useState(() => new Date().toDateString());
  const notificationIntervalRef = useRef<number | null>(null);
  const storedNotificationIdsRef = useRef<Set<string>>(new Set());
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
    if (typeof window === "undefined") return;
    if (!user) return;
    if (!("Notification" in window)) return;

    const saveNotification = async ({
      notificationId,
      title,
      body,
      url,
      markRead
    }: {
      notificationId: string;
      title: string;
      body: string;
      url: string;
      markRead?: boolean;
    }) => {
      if (storedNotificationIdsRef.current.has(notificationId)) {
        if (!markRead) return;
      }
      storedNotificationIdsRef.current.add(notificationId);
      const docRef = doc(db, "users", user.uid, "notifications", notificationId);
      await setDoc(
        docRef,
        {
          title,
          body,
          url,
          read: Boolean(markRead),
          readAt: markRead ? serverTimestamp() : null,
          createdAt: serverTimestamp(),
          author_uid: user.uid
        },
        { merge: true }
      );
    };

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, payload } = event.data ?? {};
      if (!payload?.notificationId) return;
      if (type === "notification-received") {
        saveNotification({
          notificationId: payload.notificationId,
          title: payload.title,
          body: payload.body,
          url: payload.url
        }).catch(() => undefined);
      }
      if (type === "notification-clicked") {
        saveNotification({
          notificationId: payload.notificationId,
          title: payload.title,
          body: payload.body,
          url: payload.url,
          markRead: true
        }).catch(() => undefined);
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    }

    const registerToken = async () => {
      if (Notification.permission === "default") {
        await Notification.requestPermission().catch(() => undefined);
      }
      if (Notification.permission !== "granted") return;

      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      const registration = await navigator.serviceWorker.ready;
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });
      if (!token) return;

      const idToken = await user.getIdToken();
      const endpoint =
        import.meta.env.VITE_NOTIFICATION_SERVICE_URL || "https://next-gen-track.web.app";
      await fetch(`${endpoint}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          token,
          userAgent: navigator.userAgent
        })
      });
    };

    const registerForegroundListener = async () => {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;
      return onMessage(messaging, (payload) => {
        const notificationId =
          payload?.data?.notificationId ||
          (window.crypto?.randomUUID ? window.crypto.randomUUID() : String(Date.now()));
        saveNotification({
          notificationId,
          title: payload?.data?.title || "Aura Pulse",
          body: payload?.data?.body || "You have updates waiting.",
          url: payload?.data?.url || "/todos"
        }).catch(() => undefined);
      });
    };

    registerToken().catch(() => undefined);
    const unsubscribeForeground = registerForegroundListener();

    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      }
      Promise.resolve(unsubscribeForeground).then((unsubscribe) => unsubscribe?.());
    };
  }, [user]);

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
      const data = snapshot.docs
        .map((docSnapshot) => ({
          id: docSnapshot.id,
          ...(docSnapshot.data() as Omit<Todo, "id">)
        }))
        .filter((todo) => !todo.archivedAt);
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
    const endpoint = import.meta.env.VITE_NOTIFICATION_SERVICE_URL;
    if (!endpoint) return;

    const ping = () => {
      fetch(`${endpoint}/health`).catch(() => undefined);
    };

    ping();
    const pingIntervalMinutes = Number(
      import.meta.env.VITE_NOTIFICATION_PING_INTERVAL_MINUTES || "30"
    );
    const pingInterval = window.setInterval(
      ping,
      Math.max(pingIntervalMinutes, 1) * 60 * 1000
    );
    return () => window.clearInterval(pingInterval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user) return;
    if (!("Notification" in window)) return;

    const summaryIntervalMinutes = Number(
      import.meta.env.VITE_NOTIFICATION_SUMMARY_INTERVAL_MINUTES || "5"
    );
    const intervalMs = Math.max(summaryIntervalMinutes, 1) * 60 * 1000;

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
