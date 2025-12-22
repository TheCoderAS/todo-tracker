"use client";

import { useEffect, useState } from "react";
import {
  FiCalendar,
  FiCheckCircle,
  FiCircle,
  FiClock,
  FiEdit2,
  FiFlag,
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
  onDelete: (todoId: string) => void;
  selectedTodo: Todo | null;
  onSelectTodo: (todo: Todo | null) => void;
};

export default function TodoList({
  groups,
  formatDate,
  onEdit,
  onToggleStatus,
  onDelete,
  selectedTodo,
  onSelectTodo
}: TodoListProps) {
  const [countdown, setCountdown] = useState("00:00:00");
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

  useEffect(() => {
    if (!selectedTodo?.scheduledDate) {
      setCountdown("00:00:00");
      return;
    }
    const targetDate = selectedTodo.scheduledDate.toDate();
    const updateCountdown = () => setCountdown(formatCountdown(targetDate));
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [selectedTodo]);

  if (isEmpty) {
    return <p className="text-sm text-slate-400">No todos yet. Add one with the + button.</p>;
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

  return (
    <div className="grid gap-4">
      {groups.map((group) => (
        <div key={group.title} className="grid gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold capitalize tracking-[0.05em] text-slate-300">
            <FiCalendar aria-hidden className="text-slate-400" />
            <span>{group.title}</span>
          </h3>
          {group.items.map((todo) => {
            const dueMeta = getDueMeta(todo);
            return (
              <article
                key={todo.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/50 px-4 py-3 transition hover:border-slate-700/80"
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
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="min-w-0">
                    <strong className="block truncate text-sm font-semibold text-white">
                      {todo.title}
                    </strong>
                    <span className={`mt-1 flex items-center gap-1 text-xs ${dueMeta.className}`}>
                      <FiClock aria-hidden />
                      {dueMeta.label}
                    </span>
                  </div>
                </div>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/70 ${priorityIconStyles[todo.priority]}`}
                  title={`Priority: ${todo.priority}`}
                >
                  <FiFlag aria-hidden />
                  <span className="sr-only">Priority {todo.priority}</span>
                </span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/70 ${statusIconStyles[todo.status]}`}
                  title={`Status: ${todo.status}`}
                >
                  {todo.status === "completed" ? (
                    <FiCheckCircle aria-hidden />
                  ) : (
                    <FiCircle aria-hidden />
                  )}
                  <span className="sr-only">Status {todo.status}</span>
                </span>
              </article>
            );
          })}
        </div>
      ))}
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
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/70 text-slate-200"
                  onClick={() => onSelectTodo(null)}
                  aria-label="Close"
                >
                  <FiX aria-hidden />
                </button>
              </div>
              <div className="grid gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <FiCalendar aria-hidden className="text-slate-400" />
                  <span>{formatDate(selectedTodo.scheduledDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiWatch aria-hidden className="text-slate-400" />
                  <span>{countdown}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiTag aria-hidden className="text-slate-400" />
                  <span>{selectedTodo.tags.length ? selectedTodo.tags.join(", ") : "—"}</span>
                </div>
              </div>
              <div className="grid gap-2 text-sm text-slate-200">
                <p className="text-xs font-semibold capitalize tracking-[0.05em] text-slate-300">
                  Description
                </p>
                {selectedTodo.description?.trim() ? (
                  <div
                    className="space-y-2 text-sm text-slate-200 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: selectedTodo.description }}
                  />
                ) : (
                  <p className="text-xs text-slate-400">No description provided.</p>
                )}
              </div>
            </div>
            <div className="flex min-w-0 flex-row flex-nowrap items-center gap-2 text-slate-200">
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
