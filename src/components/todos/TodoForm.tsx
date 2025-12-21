import type { FormEvent } from "react";

import type { TodoInput, TodoPriority } from "@/lib/types";

const inputClasses =
  "rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-slate-100";

const labelClasses =
  "flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400";

type TodoFormProps = {
  form: TodoInput;
  priorities: TodoPriority[];
  isEditing: boolean;
  error: string | null;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (event: FormEvent) => void;
  onCancelEdit: () => void;
};

export default function TodoForm({
  form,
  priorities,
  isEditing,
  error,
  onChange,
  onSubmit,
  onCancelEdit
}: TodoFormProps) {
  return (
    <form
      className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-xl"
      onSubmit={onSubmit}
    >
      <h2 className="text-xl font-semibold text-white">
        {isEditing ? "Edit todo" : "Add a new todo"}
      </h2>
      <input
        name="title"
        placeholder="Todo title"
        value={form.title}
        onChange={onChange}
        className={`mt-4 w-full ${inputClasses}`}
      />
  <div className="mt-4 flex flex-wrap gap-4">
    <label className={labelClasses}>
      Scheduled date
      <input
        name="scheduledDate"
        type="date"
        value={form.scheduledDate}
        onChange={onChange}
        className={inputClasses}
      />
    </label>
    <label className={labelClasses}>
      Scheduled time
      <input
        name="scheduledTime"
        type="time"
        value={form.scheduledTime}
        onChange={onChange}
        className={inputClasses}
      />
    </label>
    <label className={labelClasses}>
      Priority
      <select
        name="priority"
            value={form.priority}
            onChange={onChange}
            className={inputClasses}
          >
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClasses}>
          Tags
          <input
            name="tags"
            placeholder="design, research"
            value={form.tags}
            onChange={onChange}
            className={inputClasses}
          />
        </label>
      </div>
      {error ? (
        <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          {error}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
        >
          {isEditing ? "Save changes" : "Add"}
        </button>
        {isEditing ? (
          <button
            type="button"
            className="rounded-full border border-slate-700/70 px-5 py-2 text-sm font-semibold text-slate-200"
            onClick={onCancelEdit}
          >
            Cancel edit
          </button>
        ) : null}
      </div>
    </form>
  );
}
