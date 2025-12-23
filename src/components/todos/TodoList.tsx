"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiCircle,
  FiClock,
  FiEdit2,
  FiFlag,
  FiLayers,
  FiTag,
  FiTrash2,
  FiWatch,
  FiX
} from "react-icons/fi";

import Modal from "@/components/ui/Modal";
import type { Todo } from "@/lib/types";

type TodoListProps = {
  groups: { title: string; items: Todo[] }[];
  formatDate: (timestamp: Todo["scheduledDate"]) => string;
  onEdit: (todo: Todo) => void;
  onToggleStatus: (todo: Todo) => void;
  onToggleFlag: (todo: Todo) => void;
  onDelete: (todoId: string) => void;
  selectedTodo: Todo | null;
  onSelectTodo: (todo: Todo | null) => void;
  emptyStateLabel: string;
  lastCompletedId: string | null;
  isLoading: boolean;
};

export default function TodoList({
  groups,
  formatDate,
  onEdit,
  onToggleStatus,
  onToggleFlag,
  onDelete,
  selectedTodo,
  onSelectTodo,
  emptyStateLabel,
  lastCompletedId,
  isLoading
}: TodoListProps) {
  const [countdown, setCountdown] = useState("00:00:00");
  const [showCompleted, setShowCompleted] = useState(false);
  const isEmpty = groups.length === 0 || groups.every((group) => group.items.length === 0);

  const priorityIconStyles: Record<Todo["priority"], string> = {
    low: "text-emerald-300",
    medium: "text-amber-300",
    high: "text-rose-300"
  };

  const statusIconStyles: Record<Todo["status"], string> = {
    pending: "text-slate-300",
    completed: "text-emerald-300"
  };

  const formatTitleCase = (value: string) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

  const looksLikeHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const formatInlineMarkdown = (value: string) =>
    escapeHtml(value)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");

  const markdownToHtml = (value: string) => {
    const lines = value.split(/\r?\n/);
    let html = "";
    let listMode: "ol" | "ul" | null = null;
    const closeList = () => {
      if (listMode) {
        html += `</${listMode}>`;
        listMode = null;
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      const unorderedMatch = /^\s*[-*]\s+(.+)/.exec(line);
      const orderedMatch = /^\s*\d+\.\s+(.+)/.exec(line);

      if (unorderedMatch) {
        if (listMode !== "ul") {
          closeList();
          html += "<ul>";
          listMode = "ul";
        }
        html += `<li>${formatInlineMarkdown(unorderedMatch[1])}</li>`;
        return;
      }

      if (orderedMatch) {
        if (listMode !== "ol") {
          closeList();
          html += "<ol>";
          listMode = "ol";
        }
        html += `<li>${formatInlineMarkdown(orderedMatch[1])}</li>`;
        return;
      }

      closeList();
      if (trimmed) {
        html += `<p>${formatInlineMarkdown(trimmed)}</p>`;
      }
    });

    closeList();
    return html;
  };

  const formatDescriptionHtml = (value: string) =>
    looksLikeHtml(value) ? value : markdownToHtml(value);

  const countListItems = (value: string) => {
    if (!value) return 0;
    if (looksLikeHtml(value)) {
      return value.match(/<li>/g)?.length ?? 0;
    }
    return value
      .split(/\r?\n/)
      .filter((line) => /^\s*(?:[-*]|\d+\.)\s+/.test(line)).length;
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  const formatCountdown = (target: Date | null) => {
    if (!target) return "00:00:00";
    const diffMs = target.getTime() - Date.now();
    if (diffMs <= 0) return "00:00:00";
    const totalSeconds = Math.floor(diffMs / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const totalHours = Math.floor(totalMinutes / 60);
    const hours = totalHours % 24;
    const totalDays = Math.floor(totalHours / 24);
    const days = totalDays % 30;
    const months = Math.floor(totalDays / 30);
    const pad = (value: number) => String(value).padStart(2, "0");
    if (months > 0) {
      return `${pad(months)}:${pad(days)}:${pad(hours)}`;
    }
    if (totalDays > 0) {
      return `${pad(totalDays)}:${pad(hours)}:${pad(minutes)}`;
    }
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const groupSplit = useMemo(() => {
    const pendingGroups: { title: string; items: Todo[] }[] = [];
    const completedGroups: { title: string; items: Todo[] }[] = [];
    groups.forEach((group) => {
      const pendingItems = group.items.filter((todo) => todo.status !== "completed");
      const completedItems = group.items.filter((todo) => todo.status === "completed");
      if (pendingItems.length) pendingGroups.push({ title: group.title, items: pendingItems });
      if (completedItems.length)
        completedGroups.push({ title: group.title, items: completedItems });
    });
    return { pendingGroups, completedGroups };
  }, [groups]);

  const hasCompleted = groupSplit.completedGroups.some((group) => group.items.length > 0);

  useEffect(() => {
    if (!selectedTodo) {
      setCountdown("00:00:00");
      return;
    }
    const isCompleted = selectedTodo.status === "completed";
    if (isCompleted || !selectedTodo.scheduledDate) {
      setCountdown("00:00:00");
      return;
    }
    const targetDate = selectedTodo.scheduledDate.toDate();
    const updateCountdown = () => setCountdown(formatCountdown(targetDate));
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [selectedTodo]);

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[...Array(3)].map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="status-ring animate-pulse rounded-3xl bg-slate-900/60 p-4"
          >
            <div className="h-3 w-24 rounded-full bg-slate-800/70" />
            <div className="mt-4 h-4 w-3/4 rounded-full bg-slate-800/70" />
            <div className="mt-3 h-3 w-1/2 rounded-full bg-slate-800/70" />
            <div className="mt-4 flex gap-2">
              <div className="h-7 w-16 rounded-full bg-slate-800/70" />
              <div className="h-7 w-20 rounded-full bg-slate-800/70" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return <p className="text-sm text-slate-400">{emptyStateLabel}</p>;
  }

  const getDueMeta = (todo: Todo) => {
    if (todo.status === "completed") {
      return { label: "Completed", className: "text-emerald-300" };
    }
    if (!todo.scheduledDate) {
      return { label: "No due time", className: "text-slate-500" };
    }
    const diffMs = todo.scheduledDate.toMillis() - Date.now();
    if (diffMs <= 0) {
      return { label: "Overdue", className: "text-rose-300" };
    }
    const totalMinutes = Math.ceil(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const diffHours = diffMs / 3600000;
    const className =
      diffHours > 3
        ? "text-emerald-300"
        : diffHours > 1
        ? "text-amber-300"
        : "text-rose-300";
    return { label: `Due in ${hours}h ${minutes}m`, className };
  };

  const renderGroup = (group: { title: string; items: Todo[] }) => (
    <div key={group.title} className="grid gap-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold capitalize text-slate-300">
        <FiCalendar aria-hidden className="text-slate-400" />
        <span>{group.title}</span>
      </h3>
      <div className="grid gap-3">
        {group.items.map((todo) => {
          const dueMeta = getDueMeta(todo);
          const scheduledDate = todo.scheduledDate?.toDate() ?? null;
          const isOverdue =
            todo.status !== "completed" &&
            scheduledDate !== null &&
            scheduledDate.getTime() < Date.now();
          const diffHours = scheduledDate
            ? (scheduledDate.getTime() - Date.now()) / 3600000
            : null;
          const isDueSoon =
            todo.status !== "completed" && diffHours !== null && diffHours > 0 && diffHours <= 3;
          const isCompleted = todo.status === "completed";
          const shouldCelebrate = todo.id === lastCompletedId;
          const subtaskCount = countListItems(todo.description ?? "");
          const cardTone = isOverdue
            ? "glow-rose"
            : isDueSoon
            ? "glow-amber"
            : isCompleted
            ? "glow-emerald"
            : "status-ring";
          return (
            <article
              key={todo.id}
              className={`flex flex-col gap-4 rounded-3xl border border-slate-900/60 bg-gradient-to-br from-slate-900/80 via-slate-950/90 to-slate-950/80 px-5 py-4 transition hover:border-slate-700/70 ${cardTone} ${
                isCompleted ? "opacity-70" : ""
              } ${isDueSoon ? "amber-pulse" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => onSelectTodo(todo)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectTodo(todo);
                }
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong
                    className={`block truncate text-base font-semibold text-white ${
                      isCompleted ? "line-through decoration-emerald-400/70" : ""
                    }`}
                  >
                    {todo.title}
                  </strong>
                  <span
                    className={`mt-1 flex items-center gap-2 text-xs ${dueMeta.className} ${
                      isOverdue ? "text-rose-300" : ""
                    }`}
                  >
                    {isOverdue ? (
                      <FiAlertTriangle aria-hidden className="text-rose-300" />
                    ) : (
                      <FiClock aria-hidden />
                    )}
                    {dueMeta.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={`flex h-10 w-10 items-center justify-center rounded-full border border-slate-800/70 bg-slate-950/60 text-sm transition hover:border-slate-600/70 ${
                      todo.priority === "high"
                        ? "text-amber-200"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleFlag(todo);
                    }}
                    aria-label={
                      todo.priority === "high"
                        ? "Remove priority flag"
                        : "Flag as priority"
                    }
                  >
                    <FiFlag aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={`flex h-10 w-10 items-center justify-center rounded-full border border-slate-800/70 bg-slate-950/60 text-sm transition hover:border-slate-600/70 ${
                      isCompleted ? "text-emerald-200" : "text-slate-300 hover:text-white"
                    } ${shouldCelebrate ? "celebrate-pop" : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleStatus(todo);
                    }}
                    aria-label={
                      todo.status === "completed"
                        ? "Mark todo as pending"
                        : "Mark todo as completed"
                    }
                  >
                    {todo.status === "completed" ? (
                      <FiCircle aria-hidden />
                    ) : (
                      <FiCheckCircle aria-hidden />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span
                  className={`flex items-center gap-1 rounded-full bg-slate-950/70 px-2 py-1 ${
                    priorityIconStyles[todo.priority]
                  }`}
                >
                  <FiFlag aria-hidden />
                  {formatTitleCase(todo.priority)}
                </span>
                {todo.tags.slice(0, 2).map((tag) => (
                  <span
                    key={`${todo.id}-${tag}`}
                    className="rounded-full border border-slate-800/70 bg-slate-950/70 px-2 py-1 text-slate-300"
                  >
                    #{tag}
                  </span>
                ))}
                {subtaskCount > 0 ? (
                  <span className="flex items-center gap-1 rounded-full border border-slate-800/70 bg-slate-950/70 px-2 py-1 text-slate-300">
                    <FiLayers aria-hidden />
                    {subtaskCount} subtasks
                  </span>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="grid gap-6">
      {groupSplit.pendingGroups.map((group) => renderGroup(group))}
      {hasCompleted ? (
        <div className="grid gap-3">
          <button
            type="button"
            className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-xs font-semibold text-slate-200 transition hover:border-slate-600/70"
            onClick={() => setShowCompleted((prev) => !prev)}
            aria-expanded={showCompleted}
          >
            <span>Completed tasks</span>
            <span className="text-slate-400">{showCompleted ? "Hide" : "Show"}</span>
          </button>
          {showCompleted ? (
            <div className="grid gap-4">
              {groupSplit.completedGroups.map((group) => renderGroup(group))}
            </div>
          ) : null}
        </div>
      ) : null}
      <Modal
        isOpen={Boolean(selectedTodo)}
        onClose={() => onSelectTodo(null)}
        ariaLabel="Todo details"
      >
        {selectedTodo ? (
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-6">
            <div className="grid gap-5">
              <div className="flex items-start justify-between gap-4">
                <div className="grid gap-2">
                  <h3 className="text-lg font-semibold text-white">{selectedTodo.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span
                      className={`flex items-center gap-1 rounded-full bg-slate-950/70 px-2 py-1 ${priorityIconStyles[selectedTodo.priority]}`}
                    >
                      <FiFlag aria-hidden />
                      <span>{formatTitleCase(selectedTodo.priority)}</span>
                    </span>
                    <span
                      className={`flex items-center gap-1 rounded-full bg-slate-950/70 px-2 py-1 ${statusIconStyles[selectedTodo.status]}`}
                    >
                      {selectedTodo.status === "completed" ? (
                        <FiCheckCircle aria-hidden />
                      ) : (
                        <FiCircle aria-hidden />
                      )}
                      <span>{formatTitleCase(selectedTodo.status)}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <FiCalendar aria-hidden className="text-slate-400" />
                  <span>{formatDate(selectedTodo.scheduledDate)}</span>
                </div>
                {selectedTodo.status !== "completed" ? (
                  <div className="flex items-center gap-2">
                    <FiWatch aria-hidden className="text-slate-400" />
                    <span>{countdown}</span>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <FiTag aria-hidden className="text-slate-400" />
                  <span>{selectedTodo.tags.length ? selectedTodo.tags.join(", ") : "—"}</span>
                </div>
              </div>
              <div className="grid gap-2 text-sm text-slate-200">
                <p className="text-xs font-semibold capitalize text-slate-300">
                  Description
                </p>
                {selectedTodo.description?.trim() ? (
                  <div
                    className="space-y-2 text-sm text-slate-200 [&_em]:text-slate-100 [&_ol]:list-decimal [&_ol]:pl-5 [&_s]:line-through [&_strike]:line-through [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{
                      __html: formatDescriptionHtml(selectedTodo.description)
                    }}
                  />
                ) : (
                  <p className="text-xs text-slate-400">No description provided.</p>
                )}
              </div>
            </div>
            <div className="flex min-w-[3.5rem] flex-col items-center gap-2 text-slate-200">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700/70 text-slate-200 transition hover:border-slate-500"
                onClick={() => onSelectTodo(null)}
                aria-label="Close"
              >
                <FiX aria-hidden />
              </button>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700/70 text-slate-200 transition hover:border-slate-500"
                onClick={() => {
                  onEdit(selectedTodo);
                  onSelectTodo(null);
                }}
                aria-label="Edit todo"
              >
                <FiEdit2 aria-hidden />
              </button>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700/70 text-slate-200 transition hover:border-slate-500"
                onClick={() => {
                  onToggleStatus(selectedTodo);
                }}
                aria-label={
                  selectedTodo.status === "completed"
                    ? "Mark todo as pending"
                    : "Mark todo as completed"
                }
              >
                {selectedTodo.status === "completed" ? (
                  <FiCircle aria-hidden />
                ) : (
                  <FiCheckCircle aria-hidden />
                )}
              </button>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-400/40 text-rose-100 transition hover:border-rose-300"
                onClick={() => {
                  onDelete(selectedTodo.id);
                  onSelectTodo(null);
                }}
                aria-label="Delete todo"
              >
                <FiTrash2 aria-hidden />
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
