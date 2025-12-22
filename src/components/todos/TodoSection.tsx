"use client";

import { FiFilter } from "react-icons/fi";

import TodoList from "@/components/todos/TodoList";
import type { Todo } from "@/lib/types";

type TodoSectionProps = {
  groups: { title: string; items: Todo[] }[];
  formatDate: (timestamp: Todo["scheduledDate"]) => string;
  onEdit: (todo: Todo) => void;
  onToggleStatus: (todo: Todo) => void;
  onDelete: (todoId: string) => void;
  selectedTodo: Todo | null;
  onSelectTodo: (todo: Todo | null) => void;
  onOpenFilter: () => void;
  onOpenCreate: () => void;
};

export default function TodoSection({
  groups,
  formatDate,
  onEdit,
  onToggleStatus,
  onDelete,
  selectedTodo,
  onSelectTodo,
  onOpenFilter,
  onOpenCreate
}: TodoSectionProps) {
  return (
    <section className="grid gap-6">
      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Your todos</h2>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700/70 text-slate-200 transition hover:border-slate-500"
            onClick={onOpenFilter}
            aria-label="Open filters"
          >
            <FiFilter aria-hidden />
          </button>
        </div>
        <TodoList
          groups={groups}
          formatDate={formatDate}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
          selectedTodo={selectedTodo}
          onSelectTodo={onSelectTodo}
        />
      </section>
      <button
        type="button"
        className="fixed bottom-24 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400 text-3xl font-semibold text-slate-950 shadow-xl shadow-slate-950/40 transition hover:bg-emerald-300 sm:bottom-8"
        onClick={onOpenCreate}
        aria-label="Add todo"
      >
        +
      </button>
    </section>
  );
}
