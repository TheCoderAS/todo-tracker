"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import type { User } from "firebase/auth";

import { db } from "@/lib/firebase";
import { getDateKey } from "@/lib/habitUtils";
import type { FocusBlock, Habit, Todo } from "@/lib/types";
import type { SnackbarVariant } from "@/components/ui/Snackbar";

const formatDuration = (totalSeconds: number) => {
  const minutes = Math.max(Math.floor(totalSeconds / 60), 0);
  const seconds = Math.max(totalSeconds % 60, 0);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const buildBlockLabel = (todoCount: number, habitCount: number) => {
  const segments = [];
  if (todoCount > 0) segments.push(`${todoCount} todo${todoCount === 1 ? "" : "s"}`);
  if (habitCount > 0) {
    segments.push(`${habitCount} habit${habitCount === 1 ? "" : "s"}`);
  }
  return segments.length ? segments.join(" • ") : "No items selected";
};

const getFocusBlockEnd = (block: FocusBlock) => {
  if (!block.startedAt) return null;
  const startMs = block.startedAt.toDate().getTime();
  return new Date(startMs + block.durationMinutes * 60 * 1000);
};

const getHabitCompletionStatus = (habit: Habit, today: Date) => {
  const key = getDateKey(today, habit.timezone);
  return habit.completionDates?.includes(key);
};

const getCompletionMetrics = (
  block: FocusBlock,
  todos: Todo[],
  habits: Habit[]
) => {
  const selectedTodos = todos.filter((todo) => block.selectedTodoIds.includes(todo.id));
  const selectedHabits = habits.filter((habit) =>
    block.selectedHabitIds.includes(habit.id)
  );
  const completedTodos = selectedTodos.filter((todo) => todo.status === "completed")
    .length;
  const today = new Date();
  const completedHabits = selectedHabits.filter((habit) =>
    getHabitCompletionStatus(habit, today)
  ).length;

  const totalItems = selectedTodos.length + selectedHabits.length;
  const completedItems = completedTodos + completedHabits;
  const completionRate = totalItems > 0 ? completedItems / totalItems : 0;
  const startedAt = block.startedAt?.toDate();
  const actualDurationMinutes = startedAt
    ? Math.max(Math.round((Date.now() - startedAt.getTime()) / 60000), 1)
    : block.durationMinutes;

  return {
    totalTodos: selectedTodos.length,
    completedTodos,
    totalHabits: selectedHabits.length,
    completedHabits,
    completionRate,
    actualDurationMinutes
  };
};

type FocusBlockPanelProps = {
  user: User | null | undefined;
  todos: Todo[];
  habits: Habit[];
  activeBlock: FocusBlock | null;
  loading: boolean;
  onNotify: (message: string, variant: SnackbarVariant) => void;
};

export default function FocusBlockPanel({
  user,
  todos,
  habits,
  activeBlock,
  loading,
  onNotify
}: FocusBlockPanelProps) {
  const [selectedTodoIds, setSelectedTodoIds] = useState<string[]>([]);
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [actionLoading, setActionLoading] = useState(false);
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    if (!activeBlock?.startedAt) return;
    const interval = window.setInterval(() => {
      setTick(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [activeBlock?.startedAt]);

  const availableTodos = useMemo(
    () => todos.filter((todo) => todo.status !== "completed"),
    [todos]
  );

  const activeBlockTodos = useMemo(() => {
    if (!activeBlock) return [] as Todo[];
    return todos.filter((todo) => activeBlock.selectedTodoIds.includes(todo.id));
  }, [activeBlock, todos]);

  const activeBlockHabits = useMemo(() => {
    if (!activeBlock) return [] as Habit[];
    return habits.filter((habit) => activeBlock.selectedHabitIds.includes(habit.id));
  }, [activeBlock, habits]);

  const remainingSeconds = useMemo(() => {
    if (!activeBlock?.startedAt) return 0;
    const end = getFocusBlockEnd(activeBlock);
    if (!end) return 0;
    const remainingMs = end.getTime() - tick;
    return Math.max(Math.floor(remainingMs / 1000), 0);
  }, [activeBlock, tick]);

  const activeEndTimeLabel = useMemo(() => {
    if (!activeBlock?.startedAt) return null;
    const end = getFocusBlockEnd(activeBlock);
    if (!end) return null;
    return end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [activeBlock, tick]);

  const handleTodoToggle = (todoId: string) => {
    setSelectedTodoIds((prev) =>
      prev.includes(todoId) ? prev.filter((id) => id !== todoId) : [...prev, todoId]
    );
  };

  const handleHabitToggle = (habitId: string) => {
    setSelectedHabitIds((prev) =>
      prev.includes(habitId) ? prev.filter((id) => id !== habitId) : [...prev, habitId]
    );
  };

  const handleStartBlock = async () => {
    if (!user) {
      onNotify("Sign in to start a focus block.", "error");
      return;
    }
    if (activeBlock) {
      onNotify("Finish the active focus block before starting a new one.", "info");
      return;
    }
    if (!selectedTodoIds.length && !selectedHabitIds.length) {
      onNotify("Select at least one todo or habit to focus on.", "error");
      return;
    }

    setActionLoading(true);
    try {
      await addDoc(collection(db, "users", user.uid, "focusBlocks"), {
        status: "active",
        selectedTodoIds,
        selectedHabitIds,
        durationMinutes,
        startedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        endedAt: null,
        metrics: null
      });
      setSelectedTodoIds([]);
      setSelectedHabitIds([]);
      onNotify("Focus block started.", "success");
    } catch (error) {
      console.error(error);
      onNotify("Unable to start focus block.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteBlock = async () => {
    if (!user || !activeBlock) return;
    setActionLoading(true);
    try {
      const metrics = getCompletionMetrics(activeBlock, todos, habits);
      await updateDoc(doc(db, "users", user.uid, "focusBlocks", activeBlock.id), {
        status: "completed",
        endedAt: serverTimestamp(),
        metrics
      });
      onNotify("Focus block logged for analytics.", "success");
    } catch (error) {
      console.error(error);
      onNotify("Unable to complete focus block.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBlock = async () => {
    if (!user || !activeBlock) return;
    setActionLoading(true);
    try {
      const metrics = getCompletionMetrics(activeBlock, todos, habits);
      await updateDoc(doc(db, "users", user.uid, "focusBlocks", activeBlock.id), {
        status: "cancelled",
        endedAt: serverTimestamp(),
        metrics
      });
      onNotify("Focus block cancelled.", "info");
    } catch (error) {
      console.error(error);
      onNotify("Unable to cancel focus block.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_0_40px_rgba(15,23,42,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">
            Focus block
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {activeBlock ? "Active focus" : "Plan a focused sprint"}
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            {activeBlock
              ? buildBlockLabel(
                  activeBlock.selectedTodoIds.length,
                  activeBlock.selectedHabitIds.length
                )
              : "Pick the work that matters most and run a timed sprint."}
          </p>
        </div>
        {activeBlock ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-center">
            <p className="text-xs uppercase text-emerald-200/70">Time left</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-100">
              {formatDuration(remainingSeconds)}
            </p>
            <p className="mt-1 text-xs text-emerald-200/70">
              {remainingSeconds > 0 ? "Stay focused" : "Block finished"}
            </p>
            {activeEndTimeLabel ? (
              <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-emerald-200/50">
                Ends {activeEndTimeLabel}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {activeBlock ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <p className="text-xs uppercase text-slate-400">Selected items</p>
            <div className="mt-4 space-y-3">
              {activeBlockTodos.length ? (
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Todos</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-100">
                    {activeBlockTodos.map((todo) => (
                      <li key={todo.id} className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            todo.status === "completed" ? "bg-emerald-400" : "bg-slate-500"
                          }`}
                        />
                        <span>{todo.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {activeBlockHabits.length ? (
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Habits</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-100">
                    {activeBlockHabits.map((habit) => (
                      <li key={habit.id} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-sky-400" />
                        <span>{habit.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {!activeBlockTodos.length && !activeBlockHabits.length ? (
                <p className="text-sm text-slate-400">No items selected.</p>
              ) : null}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <p className="text-xs uppercase text-slate-400">Analytics snapshot</p>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span>Todos completed</span>
                <span className="font-semibold text-white">
                  {activeBlockTodos.filter((todo) => todo.status === "completed").length} / {" "}
                  {activeBlockTodos.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Habits checked today</span>
                <span className="font-semibold text-white">
                  {
                    activeBlockHabits.filter((habit) =>
                      getHabitCompletionStatus(habit, new Date())
                    ).length
                  }{" "}
                  / {activeBlockHabits.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Duration</span>
                <span className="font-semibold text-white">
                  {activeBlock.durationMinutes} min
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Completion rate</span>
                <span className="font-semibold text-white">
                  {Math.round(
                    (activeBlockTodos.length + activeBlockHabits.length > 0
                      ? (activeBlockTodos.filter((todo) => todo.status === "completed")
                          .length +
                          activeBlockHabits.filter((habit) =>
                            getHabitCompletionStatus(habit, new Date())
                          ).length) /
                        (activeBlockTodos.length + activeBlockHabits.length)
                      : 0) * 100
                  )}
                  %
                </span>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                className="w-full rounded-2xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/60 hover:bg-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleCompleteBlock}
                disabled={actionLoading}
              >
                Log completion metrics
              </button>
              <button
                type="button"
                className="w-full rounded-2xl border border-slate-700/60 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-600/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleCancelBlock}
                disabled={actionLoading}
              >
                Cancel focus block
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <p className="text-xs uppercase text-slate-400">Select todos</p>
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              {availableTodos.length ? (
                availableTodos.map((todo) => (
                  <label
                    key={todo.id}
                    className="flex items-center gap-3 rounded-xl border border-transparent bg-slate-950/30 px-3 py-2 transition hover:border-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTodoIds.includes(todo.id)}
                      onChange={() => handleTodoToggle(todo.id)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-emerald-400 focus:ring-emerald-300/30"
                    />
                    <span>{todo.title}</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-slate-400">No pending todos to focus on.</p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <p className="text-xs uppercase text-slate-400">Select habits</p>
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              {habits.length ? (
                habits.map((habit) => (
                  <label
                    key={habit.id}
                    className="flex items-center gap-3 rounded-xl border border-transparent bg-slate-950/30 px-3 py-2 transition hover:border-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedHabitIds.includes(habit.id)}
                      onChange={() => handleHabitToggle(habit.id)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-sky-400 focus:ring-sky-300/30"
                    />
                    <span>{habit.title}</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-slate-400">No habits available.</p>
              )}
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase text-slate-400">Sprint length</p>
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={durationMinutes}
                  onChange={(event) =>
                    setDurationMinutes(
                      Math.min(120, Math.max(5, Number(event.target.value) || 5))
                    )
                  }
                  className="h-10 w-24 rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-white"
                />
                <span className="text-sm text-slate-400">minutes</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Suggested range: 25-50 minutes.
              </p>
            </div>
            <button
              type="button"
              className="mt-5 w-full rounded-2xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/60 hover:bg-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleStartBlock}
              disabled={actionLoading || loading}
            >
              Start focus block
            </button>
            {loading ? (
              <p className="mt-3 text-xs uppercase text-slate-500">Syncing focus data…</p>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
