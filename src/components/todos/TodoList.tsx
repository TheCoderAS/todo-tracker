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
    return <p className="text-sm text-slate-400">No todos yet. Add one above.</p>;
  }

  const priorityStyles: Record<Todo["priority"], string> = {
    low: "bg-emerald-500/15 text-emerald-200",
    medium: "bg-amber-500/20 text-amber-200",
    high: "bg-rose-500/20 text-rose-200"
  };

  const statusStyles: Record<Todo["status"], string> = {
    pending: "bg-slate-800/70 text-slate-300",
    completed: "bg-emerald-500/20 text-emerald-200"
  };

  return (
    <div className="grid gap-4">
      {groups.map((group) => (
        <div key={group.title} className="grid gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            {group.title}
          </h3>
          {group.items.map((todo) => (
            <article
              key={todo.id}
              className="grid gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/50 p-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <strong className="text-sm text-white">{todo.title}</strong>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityStyles[todo.priority]}`}
                >
                  {todo.priority}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[todo.status]}`}
                >
                  {todo.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                <span>Scheduled: {formatDate(todo.scheduledDate)}</span>
                <span>
                  Completed:{" "}
                  {todo.completedDate ? formatDate(todo.completedDate) : "Not completed"}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Tags: {todo.tags.length ? todo.tags.join(", ") : "—"}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-slate-700/70 px-4 py-1.5 text-xs font-semibold text-slate-200"
                  onClick={() => onEdit(todo)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-700/70 px-4 py-1.5 text-xs font-semibold text-slate-200"
                  onClick={() => onToggleStatus(todo)}
                >
                  {todo.status === "completed" ? "Mark pending" : "Mark complete"}
                </button>
                <button
                  type="button"
                  className="rounded-full bg-rose-400/20 px-4 py-1.5 text-xs font-semibold text-rose-100"
                  onClick={() => onDelete(todo.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ))}
    </div>
  );
}
