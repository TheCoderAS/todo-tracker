"use client";

import { useMemo, useState } from "react";
import {
  FiArrowDown,
  FiArrowUp,
  FiFilter,
  FiFlag,
  FiPlus,
  FiStar,
  FiTarget,
  FiZap
} from "react-icons/fi";

import TodoList from "@/components/todos/TodoList";
import type { Todo } from "@/lib/types";

type TodoSectionProps = {
  groups: { title: string; items: Todo[] }[];
  formatDate: (timestamp: Todo["scheduledDate"]) => string;
  onEdit: (todo: Todo) => void;
  onToggleStatus: (todo: Todo) => void;
  onToggleFlag: (todo: Todo) => void;
  onDelete: (todoId: string) => void;
  selectedTodo: Todo | null;
  onSelectTodo: (todo: Todo | null) => void;
  onOpenFilter: () => void;
  onOpenCreate: () => void;
  statusFilter: "all" | Todo["status"];
  priorityFilter: "all" | Todo["priority"];
  datePreset: "all" | "today" | "spillover" | "upcoming" | "custom" | "tomorrow" | "week";
  sortBy: "scheduled" | "completed" | "priority" | "created" | "manual";
  sortOrder: "asc" | "desc";
  onQuickFilter: (value: "all" | "today" | "completed" | "flagged") => void;
  onSortByChange: (value: "scheduled" | "completed" | "priority" | "created" | "manual") => void;
  onSortOrderChange: (value: "asc" | "desc") => void;
  emptyStateLabel: string;
  todayStats: { total: number; completed: number; percent: number };
  streakCount: number;
  lastCompletedId: string | null;
  isLoading: boolean;
};

export default function TodoSection({
  groups,
  formatDate,
  onEdit,
  onToggleStatus,
  onToggleFlag,
  onDelete,
  selectedTodo,
  onSelectTodo,
  onOpenFilter,
  onOpenCreate,
  statusFilter,
  priorityFilter,
  datePreset,
  sortBy,
  sortOrder,
  onQuickFilter,
  onSortByChange,
  onSortOrderChange,
  emptyStateLabel,
  todayStats,
  streakCount,
  lastCompletedId,
  isLoading
}: TodoSectionProps) {
  const [isFabOpen, setIsFabOpen] = useState(false);
  const quickFilters = useMemo(
    () => [
      { id: "all", label: "All", icon: FiStar },
      { id: "today", label: "Today", icon: FiZap },
      { id: "completed", label: "Completed", icon: FiTarget },
      { id: "flagged", label: "Flagged", icon: FiFlag }
    ],
    []
  );

  const isTodayActive = datePreset === "today" && statusFilter !== "completed";
  const isAllActive =
    statusFilter === "all" && datePreset === "all" && priorityFilter === "all";
  const isCompletedActive = statusFilter === "completed";
  const isFlaggedActive = priorityFilter === "high";
  const activeQuickFilter = isTodayActive
    ? "today"
    : isCompletedActive
    ? "completed"
    : isFlaggedActive
    ? "flagged"
    : isAllActive
    ? "all"
    : null;

  return (
    <section className="grid gap-6">
      <section className="grid gap-5">
        <div className="grid gap-4 rounded-3xl border border-slate-900/70 bg-gradient-to-br from-slate-900/80 via-slate-950/90 to-slate-950/80 p-5 shadow-xl shadow-slate-950/40">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">
                Today progress
              </p>
              <p className="text-lg font-semibold text-white">
                {todayStats.completed}/{todayStats.total} completed
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-emerald-200">
                {todayStats.percent}%
              </span>
              <span className="text-slate-400">on track</span>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-sky-300 transition-all"
              style={{ width: `${Math.max(todayStats.percent, 8)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-950/70 px-3 py-3 text-xs text-slate-200 shadow-lg shadow-slate-950/40">
            <span className="text-slate-400">Streak</span>
            <span className="ml-2 text-xs font-semibold text-emerald-200">
              {streakCount} days
            </span>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-700/70 text-sm text-slate-200 transition hover:border-slate-500"
            onClick={onOpenFilter}
            aria-label="Open filters"
          >
            <FiFilter aria-hidden />
          </button>
        </div>

        <div className="grid gap-2 sm:gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {quickFilters.map(({ id, label, icon: Icon }) => {
              const isActive = activeQuickFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold transition sm:px-3 sm:text-[0.7rem] ${
                    isActive
                      ? "border-sky-400/60 bg-sky-400/15 text-sky-100 shadow-lg shadow-sky-500/20"
                      : "border-slate-800/70 bg-slate-950/40 text-slate-300 hover:border-slate-600/70 hover:text-white"
                  }`}
                  onClick={() => onQuickFilter(id as "all" | "today" | "completed" | "flagged")}
                >
                  <Icon aria-hidden className="text-[0.65rem] sm:text-[0.7rem]" />
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center rounded-full border border-slate-800/70 bg-slate-950/40 p-1 text-[0.65rem] font-semibold text-slate-200 sm:text-[0.7rem]">
              <button
                type="button"
                className={`rounded-full px-2.5 py-1 transition ${
                  sortBy === "scheduled" || sortBy === "completed"
                    ? "bg-slate-800/70 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
                onClick={() =>
                  onSortByChange(statusFilter === "completed" ? "completed" : "scheduled")
                }
              >
                Time
              </button>
              <button
                type="button"
                className={`rounded-full px-2.5 py-1 transition ${
                  sortBy === "priority"
                    ? "bg-slate-800/70 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
                onClick={() => onSortByChange("priority")}
              >
                Priority
              </button>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-800/70 bg-slate-950/40 text-slate-200 transition hover:border-slate-600/70 sm:h-9 sm:w-9"
              onClick={() => onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
              aria-label="Toggle sort order"
            >
              {sortOrder === "asc" ? <FiArrowUp aria-hidden /> : <FiArrowDown aria-hidden />}
            </button>
          </div>
        </div>

        <TodoList
          groups={groups}
          formatDate={formatDate}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onToggleFlag={onToggleFlag}
          onDelete={onDelete}
          selectedTodo={selectedTodo}
          onSelectTodo={onSelectTodo}
          emptyStateLabel={emptyStateLabel}
          lastCompletedId={lastCompletedId}
          isLoading={isLoading}
        />
      </section>

      <div className="fixed bottom-24 right-6 z-30 flex flex-col items-end gap-3 sm:bottom-8">
        {isFabOpen ? (
          <div className="floating-menu grid gap-2 rounded-3xl border border-slate-800/70 bg-slate-950/90 p-3 shadow-2xl shadow-slate-950/50">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-900/70"
              onClick={() => {
                onOpenCreate();
                setIsFabOpen(false);
              }}
            >
              <FiPlus aria-hidden className="text-emerald-300" />
              Task
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold text-slate-400"
              aria-disabled="true"
              disabled
            >
              <FiZap aria-hidden className="text-amber-300" />
              Reminder
            </button>
          </div>
        ) : null}
        <button
          type="button"
          className="glow-emerald flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400 text-3xl font-semibold text-slate-950 shadow-xl shadow-slate-950/40 transition hover:scale-[1.02] hover:bg-emerald-300"
          onClick={() => setIsFabOpen((prev) => !prev)}
          aria-label="Quick add menu"
          aria-expanded={isFabOpen}
        >
          <FiPlus aria-hidden />
        </button>
      </div>
    </section>
  );
}
