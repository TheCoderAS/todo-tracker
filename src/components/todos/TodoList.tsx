"use client";

import { useState } from "react";
import { FiCheckCircle, FiCircle, FiFlag } from "react-icons/fi";

import Modal from "@/components/ui/Modal";
import type { Todo } from "@/lib/types";

type TodoListProps = {
  groups: { title: string; items: Todo[] }[];
  formatDate: (timestamp: Todo["scheduledDate"]) => string;
  onEdit: (todo: Todo) => void;
  onToggleStatus: (todo: Todo) => void;
  onDelete: (todoId: string) => void;
};

export default function TodoList({
  groups,
  formatDate,
  onEdit,
  onToggleStatus,
  onDelete
}: TodoListProps) {
  if (groups.length === 0 || groups.every((group) => group.items.length === 0)) {
    return <p className="text-sm text-slate-400">No todos yet. Add one with the + button.</p>;
  }

  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  const priorityIconStyles: Record<Todo["priority"], string> = {
    low: "text-emerald-300",
    medium: "text-amber-300",
    high: "text-rose-300"
  };

  const statusIconStyles: Record<Todo["status"], string> = {
    pending: "text-slate-300",
    completed: "text-emerald-300"
  };

  return (
    <div className="grid gap-4">
      {groups.map((group) => (
        <div key={group.title} className="grid gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
            {group.title}
          </h3>
          {group.items.map((todo) => (
            <article
              key={todo.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/50 px-4 py-3 transition hover:border-slate-700/80"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedTodo(todo)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedTodo(todo);
                }
              }}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <strong className="truncate text-sm font-semibold text-white">
                  {todo.title}
                </strong>
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
                {todo.status === "completed" ? <FiCheckCircle aria-hidden /> : <FiCircle aria-hidden />}
                <span className="sr-only">Status {todo.status}</span>
              </span>
            </article>
          ))}
        </div>
      ))}
      <Modal
        isOpen={Boolean(selectedTodo)}
        onClose={() => setSelectedTodo(null)}
        ariaLabel="Todo details"
      >
        {selectedTodo ? (
          <div className="grid gap-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedTodo.title}</h3>
                <p className="text-xs text-slate-400">
                  Priority {selectedTodo.priority} · Status {selectedTodo.status}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-700/70 px-4 py-1.5 text-xs font-semibold text-slate-200"
                onClick={() => setSelectedTodo(null)}
              >
                Close
              </button>
            </div>
            <div className="grid gap-2 text-xs text-slate-300">
              <p>Scheduled: {formatDate(selectedTodo.scheduledDate)}</p>
              <p>
                Completed:{" "}
                {selectedTodo.completedDate
                  ? formatDate(selectedTodo.completedDate)
                  : "Not completed"}
              </p>
              <p>Tags: {selectedTodo.tags.length ? selectedTodo.tags.join(", ") : "—"}</p>
            </div>
            <div className="grid gap-2 text-sm text-slate-200">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
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
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold text-slate-200"
                onClick={() => {
                  onEdit(selectedTodo);
                  setSelectedTodo(null);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold text-slate-200"
                onClick={() => {
                  onToggleStatus(selectedTodo);
                  setSelectedTodo(null);
                }}
              >
                {selectedTodo.status === "completed" ? "Mark pending" : "Mark completed"}
              </button>
              <button
                type="button"
                className="rounded-full bg-rose-400/20 px-4 py-2 text-xs font-semibold text-rose-100"
                onClick={() => {
                  onDelete(selectedTodo.id);
                  setSelectedTodo(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
