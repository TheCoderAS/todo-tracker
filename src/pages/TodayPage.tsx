import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import {
  FiArrowRight,
  FiBarChart2,
  FiCheck,
  FiClock,
  FiTarget,
  FiZap
} from "react-icons/fi";

import { useAuth } from "@/components/auth/AuthProvider";
import OnboardingModal from "@/components/onboarding/OnboardingModal";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useTodosData } from "@/hooks/todos/useTodosData";
import { useHabitsData } from "@/hooks/todos/useHabitsData";
import { db } from "@/lib/firebase";
import { getDateKey, isHabitScheduledForDate } from "@/lib/habitUtils";
import type { Habit, Todo } from "@/lib/types";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Winding down";
};

const ProgressRing = ({ percent }: { percent: number }) => {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c;
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--surface-soft)"
          strokeWidth="12"
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c5cff" />
            <stop offset="100%" stopColor="#ff5c8a" />
          </linearGradient>
        </defs>
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-[var(--text)]">{percent}%</span>
        <span className="text-[0.65rem] uppercase tracking-wide text-faint">done</span>
      </div>
    </div>
  );
};

export default function TodayPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showOnboarding, completeOnboarding } = useOnboarding(user);
  const { todos } = useTodosData(user);
  const { habits } = useHabitsData(user);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  const todayTodos = useMemo(
    () =>
      todos
        .filter(
          (t) =>
            !t.archivedAt &&
            t.scheduledDate &&
            t.scheduledDate.toDate() >= startOfDay &&
            t.scheduledDate.toDate() <= endOfDay
        )
        .sort(
          (a, b) =>
            (a.scheduledDate?.toMillis() ?? 0) - (b.scheduledDate?.toMillis() ?? 0)
        ),
    [todos] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const overdue = useMemo(
    () =>
      todos.filter(
        (t) =>
          !t.archivedAt &&
          t.status === "pending" &&
          t.scheduledDate &&
          t.scheduledDate.toDate() < startOfDay
      ),
    [todos] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const pendingTodayTodos = todayTodos.filter((t) => t.status === "pending");
  const completedTodayCount = todayTodos.filter(
    (t) => t.status === "completed"
  ).length;

  const todayHabits = useMemo(
    () => habits.filter((h) => !h.archivedAt && isHabitScheduledForDate(h, now)),
    [habits] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const habitDone = (h: Habit) =>
    h.completionDates?.includes(getDateKey(now, h.timezone)) ?? false;
  const habitsDoneCount = todayHabits.filter(habitDone).length;

  const totalToday = todayTodos.length + todayHabits.length;
  const doneToday = completedTodayCount + habitsDoneCount;
  const percent = totalToday ? Math.round((doneToday / totalToday) * 100) : 0;

  const toggleHabit = async (habit: Habit) => {
    if (!user) return;
    const key = getDateKey(now, habit.timezone);
    const done = habitDone(habit);
    const completionDates = done
      ? (habit.completionDates ?? []).filter((d) => d !== key)
      : [...(habit.completionDates ?? []), key];
    try {
      await updateDoc(doc(db, "users", user.uid, "habits", habit.id), {
        completionDates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(error);
    }
  };

  const fmtTime = (t: Todo) =>
    t.scheduledDate
      ? t.scheduledDate
          .toDate()
          .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

  const firstName =
    user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  return (
    <section className="grid gap-5 pb-4">
      <OnboardingModal isOpen={showOnboarding} onComplete={completeOnboarding} />

      <header>
        <p className="text-sm text-muted">{greeting()},</p>
        <h1 className="text-3xl font-semibold capitalize text-[var(--text)]">
          {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-faint">
          {now.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric"
          })}
        </p>
      </header>

      {/* Hero progress */}
      <div className="surface-card relative overflow-hidden p-5">
        <div className="modal-ambient pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative flex items-center gap-5">
          <ProgressRing percent={percent} />
          <div className="grid flex-1 gap-2">
            <p className="text-sm text-muted">Today&apos;s momentum</p>
            <p className="text-2xl font-semibold text-[var(--text)]">
              {doneToday} / {totalToday || 0}
            </p>
            <p className="text-xs text-faint">
              {pendingTodayTodos.length} task
              {pendingTodayTodos.length === 1 ? "" : "s"} ·{" "}
              {todayHabits.length - habitsDoneCount} habit
              {todayHabits.length - habitsDoneCount === 1 ? "" : "s"} left
            </p>
            <button
              type="button"
              onClick={() => navigate("/todos?tab=focus")}
              className="btn-pop mt-1 inline-flex w-fit items-center gap-2 px-4 py-2 text-sm font-medium"
            >
              <FiZap aria-hidden />
              Start a focus sprint
            </button>
          </div>
        </div>
      </div>

      {/* Overdue nudge */}
      {overdue.length > 0 && (
        <Link
          to="/todos?tab=review"
          className="surface-card flex items-center gap-3 border-l-4 border-l-[var(--warning)] p-4"
        >
          <FiClock className="text-[var(--warning)]" aria-hidden />
          <span className="flex-1 text-sm text-[var(--text)]">
            {overdue.length} overdue item{overdue.length === 1 ? "" : "s"} need a new
            plan
          </span>
          <FiArrowRight className="text-faint" aria-hidden />
        </Link>
      )}

      {/* Today's tasks */}
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
            <FiTarget className="text-[var(--accent)]" aria-hidden />
            Today&apos;s tasks
          </h2>
          <Link to="/todos" className="text-xs text-muted hover:text-[var(--text)]">
            View all
          </Link>
        </div>
        {pendingTodayTodos.length === 0 ? (
          <div className="surface-card p-5 text-center text-sm text-faint">
            {todayTodos.length > 0
              ? "All today's tasks are done. 🎉"
              : "Nothing scheduled for today."}
          </div>
        ) : (
          <div className="grid gap-2">
            {pendingTodayTodos.slice(0, 5).map((t) => (
              <Link
                key={t.id}
                to="/todos"
                className="surface-card flex items-center gap-3 p-3.5 transition active:scale-[0.99]"
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    t.priority === "high"
                      ? "bg-[var(--danger)]"
                      : t.priority === "medium"
                        ? "bg-[var(--warning)]"
                        : "bg-[var(--accent-3)]"
                  }`}
                />
                <span className="flex-1 truncate text-sm text-[var(--text)]">
                  {t.title}
                </span>
                {fmtTime(t) && (
                  <span className="text-xs text-faint">{fmtTime(t)}</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Today's habits */}
      {todayHabits.length > 0 && (
        <div className="grid gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
            <FiZap className="text-[var(--accent-2)]" aria-hidden />
            Habits today
          </h2>
          <div className="grid gap-2">
            {todayHabits.map((h) => {
              const done = habitDone(h);
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => toggleHabit(h)}
                  className="surface-card flex items-center gap-3 p-3.5 text-left transition active:scale-[0.99]"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
                      done
                        ? "gradient-success border-transparent text-white"
                        : "border-[var(--border-strong)] text-transparent"
                    }`}
                  >
                    <FiCheck className="h-4 w-4" aria-hidden />
                  </span>
                  <span
                    className={`flex-1 text-sm ${
                      done
                        ? "text-faint line-through"
                        : "text-[var(--text)]"
                    }`}
                  >
                    {h.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Insights entry */}
      <Link
        to="/insights"
        className="surface-card flex items-center gap-3 p-4 transition active:scale-[0.99]"
      >
        <span className="gradient-brand flex h-10 w-10 items-center justify-center rounded-2xl text-white">
          <FiBarChart2 aria-hidden />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text)]">Your insights</p>
          <p className="text-xs text-faint">Trends, streaks & productivity score</p>
        </div>
        <FiArrowRight className="text-faint" aria-hidden />
      </Link>
    </section>
  );
}
