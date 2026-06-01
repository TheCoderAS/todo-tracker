"use client";

import { useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiCheckSquare,
  FiPlus,
  FiSliders,
  FiTrash2,
  FiX,
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
  datePreset:
    | "all"
    | "today"
    | "spillover"
    | "upcoming"
    | "custom"
    | "tomorrow"
    | "week";
  sortBy: "scheduled" | "completed" | "priority" | "created" | "manual";
  sortOrder: "asc" | "desc";
  onQuickFilter: (value: "all" | "today" | "completed" | "flagged") => void;
  onSortByChange: (
    value: "scheduled" | "completed" | "priority" | "created" | "manual"
  ) => void;
  onSortOrderChange: (value: "asc" | "desc") => void;
  contextTagFilter: string;
  contextTagOptions: string[];
  onContextTagChange: (value: string) => void;
  emptyStateLabel: string;
  todayStats: { total: number; completed: number; percent: number };
  streakCount: number;
  lastCompletedId: string | null;
  isLoading: boolean;
  onReorder?: (activeId: string, overId: string) => void;
  isSelectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelectMode?: () => void;
  onToggleSelectId?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
  onClearSelection?: () => void;
  onBulkComplete?: () => void;
  onBulkDelete?: () => void;
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
  contextTagFilter,
  contextTagOptions,
  onContextTagChange,
  emptyStateLabel,
  todayStats,
  streakCount,
  lastCompletedId,
  isLoading,
  onReorder,
  isSelectMode,
  selectedIds,
  onToggleSelectMode,
  onToggleSelectId,
  onSelectAll,
  onClearSelection,
  onBulkComplete,
  onBulkDelete
}: TodoSectionProps) {
  const [isFabOpen, setIsFabOpen] = useState(false);
  const quickFilters = useMemo(
    () => [
      { id: "all", label: "All" },
      { id: "today", label: "Today" },
      { id: "completed", label: "Completed" },
      { id: "flagged", label: "Flagged" }
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

  // Show a badge on the Filters button when an "advanced" choice is active that
  // isn't reachable from the quick-filter row (so the user knows extra filtering
  // or a non-default sort is in effect even though it's hidden in the modal).
  const advancedDatePresets = ["tomorrow", "week", "spillover", "upcoming", "custom"];
  const hasAdvancedFilters =
    (priorityFilter !== "all" && priorityFilter !== "high") ||
    advancedDatePresets.includes(datePreset) ||
    !["scheduled", "completed"].includes(sortBy) ||
    sortOrder === "desc";

  return (
    <section className="grid gap-6">
      <section className="grid gap-3">
        <div className="grid gap-4 rounded-3xl border border-slate-900/70 bg-gradient-to-br from-slate-900/80 via-slate-950/90 to-slate-950/80 p-5 shadow-xl shadow-slate-950/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Today progress
              </p>
              <p className="text-lg font-medium text-white">
                {todayStats.completed}/{todayStats.total} completed
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 font-medium text-amber-200">
                🔥 {streakCount}d
              </span>
              <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 font-medium text-emerald-200">
                {todayStats.percent}%
              </span>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-brand-300 to-brand-300 transition-all"
              style={{ width: `${Math.max(todayStats.percent, 8)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-full border border-slate-800/70 bg-slate-950/40 p-1 text-xs font-medium text-slate-200">
            {quickFilters.map(({ id, label }) => {
              const isActive =
                activeQuickFilter === id || (id === "all" && !activeQuickFilter);
              return (
                <button
                  key={id}
                  type="button"
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 transition ${
                    isActive
                      ? "bg-brand-400/20 text-brand-100"
                      : "text-slate-400 hover:text-white"
                  }`}
                  onClick={() =>
                    onQuickFilter(id as "all" | "today" | "completed" | "flagged")
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>

          <label className="flex h-10 items-center gap-1.5 rounded-full border border-slate-800/70 bg-slate-950/40 pl-3 pr-1 text-xs text-slate-400">
            <span className="hidden sm:inline">Context</span>
            <select
              value={contextTagFilter}
              onChange={(event) => onContextTagChange(event.target.value)}
              aria-label="Filter by context tag"
              className="h-8 rounded-full border border-slate-800/70 bg-slate-950/60 px-2 text-xs text-slate-200 focus:border-slate-500 focus:outline-none"
            >
              <option value="all">All</option>
              {contextTagOptions.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="relative flex h-10 items-center gap-2 rounded-full border border-slate-800/70 bg-slate-950/40 px-3.5 text-xs font-medium text-slate-300 transition hover:border-slate-600/70 hover:text-white"
            onClick={onOpenFilter}
            aria-label="Open filters and sorting"
          >
            <FiSliders aria-hidden />
            <span className="hidden sm:inline">Filters</span>
            {hasAdvancedFilters ? (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-emerald-400" />
            ) : null}
          </button>

          {onToggleSelectMode && (
            <button
              type="button"
              className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm transition hover:border-slate-600/70 hover:text-white ${
                isSelectMode
                  ? "border-brand-400/60 bg-brand-400/15 text-brand-200"
                  : "border-slate-800/70 bg-slate-950/40 text-slate-300"
              }`}
              onClick={onToggleSelectMode}
              aria-label={isSelectMode ? "Exit select mode" : "Select multiple"}
            >
              <FiCheckSquare aria-hidden />
            </button>
          )}
        </div>

        {isSelectMode && selectedIds && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-2">
            <span className="text-xs font-medium text-slate-300">
              {selectedIds.size} selected
            </span>
            <div className="ml-auto flex items-center gap-2">
              {onSelectAll && (
                <button
                  type="button"
                  className="text-xs font-medium text-brand-300 transition hover:text-brand-200"
                  onClick={() => {
                    const allIds = groups.flatMap((g) =>
                      g.items.filter((t) => t.status === "pending").map((t) => t.id)
                    );
                    onSelectAll(allIds);
                  }}
                >
                  Select all
                </button>
              )}
              {onClearSelection && selectedIds.size > 0 && (
                <button
                  type="button"
                  className="text-xs font-medium text-slate-400 transition hover:text-slate-200"
                  onClick={onClearSelection}
                >
                  Clear
                </button>
              )}
              {onBulkComplete && selectedIds.size > 0 && (
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full bg-emerald-400/15 border border-emerald-400/40 px-3 py-1 text-xs font-medium text-emerald-200 transition hover:bg-emerald-400/25"
                  onClick={onBulkComplete}
                >
                  <FiCheckCircle aria-hidden />
                  Complete
                </button>
              )}
              {onBulkDelete && selectedIds.size > 0 && (
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full bg-rose-400/15 border border-rose-400/40 px-3 py-1 text-xs font-medium text-rose-200 transition hover:bg-rose-400/25"
                  onClick={onBulkDelete}
                >
                  <FiTrash2 aria-hidden />
                  Delete
                </button>
              )}
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:text-white"
                onClick={onToggleSelectMode}
                aria-label="Cancel selection"
              >
                <FiX aria-hidden />
              </button>
            </div>
          </div>
        )}

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
          sortBy={sortBy}
          onReorder={onReorder}
          isSelectMode={isSelectMode}
          selectedIds={selectedIds}
          onToggleSelectId={onToggleSelectId}
        />
      </section>

      <div className="fixed bottom-[calc(7.5rem+env(safe-area-inset-bottom))] right-5 z-30 flex flex-col items-end gap-3 sm:bottom-10 sm:right-10 xl:right-[calc((100vw-72rem)/2+1.5rem)]">
        {isFabOpen ? (
          <div className="floating-menu surface-card-strong grid gap-2 p-3 shadow-pop">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
              onClick={() => {
                onOpenCreate();
                setIsFabOpen(false);
              }}
            >
              <FiPlus aria-hidden className="text-[var(--accent)]" />
              Task
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-faint"
              aria-disabled="true"
              disabled
            >
              <FiZap aria-hidden className="text-[var(--warning)]" />
              Reminder
            </button>
          </div>
        ) : null}
        <button
          type="button"
          className="btn-pop flex h-14 w-14 items-center justify-center rounded-full text-3xl"
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
