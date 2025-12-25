"use client";

import type { FormEvent } from "react";
import { FiPlus, FiSave, FiTrash2, FiX } from "react-icons/fi";

import type { RoutineInput, TodoPriority } from "@/lib/types";

const inputClasses =
  "w-full rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 transition focus:border-emerald-300/50 focus:outline-none focus:ring-1 focus:ring-emerald-300/20";

const labelTextClasses = "text-xs font-semibold capitalize text-slate-300";

type RoutineFormProps = {
  form: RoutineInput;
  priorities: TodoPriority[];
  isEditing: boolean;
  onTitleChange: (value: string) => void;
  onItemChange: (index: number, field: keyof RoutineInput["items"][number], value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
};

export default function RoutineForm({
  form,
  priorities,
  isEditing,
  onTitleChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onSubmit,
  onCancel
}: RoutineFormProps) {
  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-white">
          {isEditing ? "Edit routine" : "Create routine"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold uppercase text-slate-300 transition hover:border-slate-500/80 hover:text-white"
        >
          <FiX />
          Close
        </button>
      </div>
      <label className="grid gap-2">
        <span className={labelTextClasses}>Routine name</span>
        <input
          value={form.title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Morning reset"
          maxLength={40}
          required
          className={inputClasses}
        />
      </label>
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <span className={labelTextClasses}>Template items</span>
          <button
            type="button"
            onClick={onAddItem}
            className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-xs font-semibold uppercase text-emerald-200 transition hover:border-emerald-300/80 hover:bg-emerald-400/20"
          >
            <FiPlus />
            Add item
          </button>
        </div>
        {form.items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/70 px-4 py-3 text-sm text-slate-400">
            Add at least one template item to run this routine.
          </p>
        ) : (
          form.items.map((item, index) => (
            <div
              key={`routine-item-${index}`}
              className="grid gap-3 rounded-3xl border border-slate-900/70 bg-slate-950/70 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Item {index + 1}</p>
                <button
                  type="button"
                  onClick={() => onRemoveItem(index)}
                  className="rounded-full border border-rose-500/40 px-3 py-2 text-xs font-semibold uppercase text-rose-300 transition hover:border-rose-400/80 hover:text-rose-100"
                  aria-label={`Remove item ${index + 1}`}
                >
                  <FiTrash2 />
                </button>
              </div>
              <label className="grid gap-2">
                <span className={labelTextClasses}>Title</span>
                <input
                  value={item.title}
                  onChange={(event) => onItemChange(index, "title", event.target.value)}
                  placeholder="Prep workspace"
                  maxLength={40}
                  required
                  className={inputClasses}
                />
              </label>
              <label className="grid gap-2">
                <span className={labelTextClasses}>Priority</span>
                <select
                  value={item.priority}
                  onChange={(event) => onItemChange(index, "priority", event.target.value)}
                  className={inputClasses}
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className={labelTextClasses}>Tags</span>
                <input
                  value={item.tags}
                  onChange={(event) => onItemChange(index, "tags", event.target.value)}
                  placeholder="focus, setup"
                  className={inputClasses}
                />
              </label>
              <label className="grid gap-2">
                <span className={labelTextClasses}>Context tags</span>
                <input
                  value={item.contextTags}
                  onChange={(event) =>
                    onItemChange(index, "contextTags", event.target.value)
                  }
                  placeholder="work, home"
                  className={inputClasses}
                />
              </label>
              <label className="grid gap-2">
                <span className={labelTextClasses}>Description</span>
                <textarea
                  value={item.description}
                  onChange={(event) =>
                    onItemChange(index, "description", event.target.value)
                  }
                  placeholder="Optional details"
                  rows={3}
                  className={`${inputClasses} resize-none`}
                />
              </label>
            </div>
          ))
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase text-emerald-200 transition hover:border-emerald-300/80 hover:bg-emerald-400/20"
        >
          <FiSave />
          {isEditing ? "Save routine" : "Create routine"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold uppercase text-slate-300 transition hover:border-slate-500/80 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
