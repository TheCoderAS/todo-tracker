import { useEffect, useState } from "react";
import { FiDownload, FiSave } from "react-icons/fi";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { useAuth } from "@/components/auth/AuthProvider";
import OverlayLoader from "@/components/ui/OverlayLoader";
import Snackbar, { type SnackbarVariant } from "@/components/ui/Snackbar";
import { db } from "@/lib/firebase";
import { useSearchData } from "@/hooks/useSearchData";

type UserSettings = {
  defaultPriority: "low" | "medium" | "high";
  defaultView: "all" | "today";
  timeFormat: "12h" | "24h";
};

const defaultSettings: UserSettings = {
  defaultPriority: "medium",
  defaultView: "all",
  timeFormat: "24h"
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { todos, habits } = useSearchData(user);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    variant: SnackbarVariant;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    setIsLoading(true);
    const fetchSettings = async () => {
      try {
        const snapshot = await getDoc(doc(db, "users", user.uid, "settings", "preferences"));
        if (!isMounted) return;
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<UserSettings>;
          setSettings({ ...defaultSettings, ...data });
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchSettings();
    return () => { isMounted = false; };
  }, [user]);

  const handleChange = (name: keyof UserSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await setDoc(
        doc(db, "users", user.uid, "settings", "preferences"),
        { ...settings, updatedAt: serverTimestamp() },
        { merge: true }
      );
      setSnackbar({ message: "Settings saved.", variant: "success" });
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to save settings.", variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      todos: todos.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        tags: t.tags,
        description: t.description,
        recurrence: t.recurrence ?? null,
        scheduledDate: t.scheduledDate?.toDate().toISOString() ?? null,
        completedDate: t.completedDate?.toDate().toISOString() ?? null,
        createdAt: t.createdAt?.toDate().toISOString() ?? null
      })),
      habits: habits.map((h) => ({
        id: h.id,
        title: h.title,
        frequency: h.frequency,
        reminderTime: h.reminderTime,
        reminderDays: h.reminderDays,
        completionDates: h.completionDates,
        archivedAt: h.archivedAt ? "archived" : null,
        createdAt: h.createdAt?.toDate().toISOString() ?? null
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aura-pulse-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSnackbar({ message: "Data exported as JSON.", variant: "success" });
  };

  const handleExportCSV = () => {
    const headers = ["Type", "Title", "Status", "Priority", "Tags", "Scheduled Date", "Completed Date", "Recurrence"];
    const rows = todos.map((t) => [
      "Todo",
      `"${t.title.replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      `"${t.tags.join(", ")}"`,
      t.scheduledDate?.toDate().toISOString() ?? "",
      t.completedDate?.toDate().toISOString() ?? "",
      t.recurrence ?? ""
    ]);

    habits.forEach((h) => {
      rows.push([
        "Habit",
        `"${h.title.replace(/"/g, '""')}"`,
        h.archivedAt ? "archived" : "active",
        "",
        "",
        "",
        "",
        h.frequency
      ]);
    });

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aura-pulse-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setSnackbar({ message: "Data exported as CSV.", variant: "success" });
  };

  const inputClasses =
    "w-full rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 transition focus:border-emerald-300/50 focus:outline-none focus:ring-1 focus:ring-emerald-300/20";

  if (isLoading) {
    return (
      <section className="relative z-10 flex min-h-[60vh] items-center justify-center">
        <OverlayLoader />
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/60">
        <p className="text-xs font-semibold uppercase text-slate-400">Settings</p>
        <h2 className="text-xl font-semibold text-white">Preferences</h2>
      </div>

      <div className="grid gap-5 rounded-3xl border border-slate-900/60 bg-slate-950/70 p-6">
        <h3 className="text-lg font-semibold text-white">Defaults</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-300">Default priority</span>
            <select
              value={settings.defaultPriority}
              onChange={(e) => handleChange("defaultPriority", e.target.value)}
              className={inputClasses}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-300">Default view</span>
            <select
              value={settings.defaultView}
              onChange={(e) => handleChange("defaultView", e.target.value)}
              className={inputClasses}
            >
              <option value="all">All tasks</option>
              <option value="today">Today only</option>
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-300">Time format</span>
            <select
              value={settings.timeFormat}
              onChange={(e) => handleChange("timeFormat", e.target.value)}
              className={inputClasses}
            >
              <option value="24h">24-hour</option>
              <option value="12h">12-hour</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.45)] transition hover:bg-emerald-300 active:scale-[0.98] sm:w-auto"
        >
          <FiSave aria-hidden />
          Save preferences
        </button>
      </div>

      <div className="grid gap-5 rounded-3xl border border-slate-900/60 bg-slate-950/70 p-6">
        <h3 className="text-lg font-semibold text-white">Data export</h3>
        <p className="text-sm text-slate-400">
          Download all your todos and habits. Your data belongs to you.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center gap-2 rounded-full border border-slate-700/70 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500/80 hover:text-white active:scale-[0.98]"
          >
            <FiDownload aria-hidden />
            Export as JSON
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-full border border-slate-700/70 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500/80 hover:text-white active:scale-[0.98]"
          >
            <FiDownload aria-hidden />
            Export as CSV
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Keyboard shortcuts</h3>
        <div className="grid gap-2 text-sm">
          {[
            { keys: "⌘K", label: "Search" },
            { keys: "N", label: "New todo/habit" },
            { keys: "F", label: "Open filters" },
            { keys: "1", label: "Switch to Todos tab" },
            { keys: "2", label: "Switch to Habits tab" }
          ].map((shortcut) => (
            <div key={shortcut.keys} className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-2">
              <span className="text-slate-300">{shortcut.label}</span>
              <kbd className="rounded border border-slate-700/70 bg-slate-900/60 px-2 py-0.5 text-xs text-slate-400">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      {isSaving ? <OverlayLoader /> : null}
      {snackbar ? (
        <Snackbar
          message={snackbar.message}
          variant={snackbar.variant}
          onDismiss={() => setSnackbar(null)}
        />
      ) : null}
    </section>
  );
}
