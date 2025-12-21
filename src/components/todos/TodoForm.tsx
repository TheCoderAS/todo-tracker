"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { FaBold, FaItalic, FaListUl } from "react-icons/fa6";

import type { TodoInput, TodoPriority } from "@/lib/types";

const inputClasses =
  "rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-slate-100";

const labelClasses = "flex flex-col gap-2";
const labelTextClasses =
  "text-xs font-semibold capitalize tracking-[0.05em] text-slate-300";

const toolbarButtonClasses =
  "flex items-center justify-center rounded-full border border-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500";

type TodoFormProps = {
  form: TodoInput;
  priorities: TodoPriority[];
  isEditing: boolean;
  titleHasError: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onCancelEdit: () => void;
};

export default function TodoForm({
  form,
  priorities,
  isEditing,
  titleHasError,
  onChange,
  onDescriptionChange,
  onSubmit,
  onCancelEdit
}: TodoFormProps) {
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    bullets: false
  });

  useEffect(() => {
    if (!descriptionRef.current) return;
    if (descriptionRef.current.innerHTML === form.description) return;
    descriptionRef.current.innerHTML = form.description;
  }, [form.description]);

  const updateToolbarState = () => {
    if (!descriptionRef.current) return;
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      bullets: document.queryCommandState("insertUnorderedList")
    });
  };

  const handleDescriptionInput = () => {
    onDescriptionChange(descriptionRef.current?.innerHTML ?? "");
    updateToolbarState();
  };

  const applyFormat = (command: "bold" | "italic" | "insertUnorderedList") => {
    descriptionRef.current?.focus();
    document.execCommand(command);
    handleDescriptionInput();
  };

  return (
    <form
      className="grid gap-4"
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
        className={`w-full ${inputClasses} ${
          titleHasError ? "border-rose-500/80 text-rose-100" : ""
        }`}
        aria-invalid={titleHasError}
      />
      <div className="mt-4 grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <label className={labelClasses}>
            <span className={labelTextClasses}>Scheduled date</span>
            <div className="relative">
              <input
                name="scheduledDate"
                type="date"
                value={form.scheduledDate}
                onChange={onChange}
                className={inputClasses}
              />
              {!form.scheduledDate ? (
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  DD/MM/YYYY
                </span>
              ) : null}
            </div>
          </label>
          <label className={labelClasses}>
            <span className={labelTextClasses}>Scheduled time</span>
            <div className="relative">
              <input
                name="scheduledTime"
                type="time"
                value={form.scheduledTime}
                onChange={onChange}
                className={inputClasses}
              />
              {!form.scheduledTime ? (
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  HH:MM
                </span>
              ) : null}
            </div>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClasses}>
            <span className={labelTextClasses}>Priority</span>
            <select
              name="priority"
              value={form.priority}
              onChange={onChange}
              className={inputClasses}
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClasses}>
            <span className={labelTextClasses}>Tags</span>
            <input
              name="tags"
              placeholder="design, research"
              value={form.tags}
              onChange={onChange}
              className={inputClasses}
            />
          </label>
        </div>
      </div>
      <label className={`${labelClasses} mt-4`}>
        <span className={labelTextClasses}>Description</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`${toolbarButtonClasses} ${
              activeFormats.bold
                ? "border-sky-400/80 bg-sky-400 text-slate-950"
                : ""
            }`}
            onClick={() => applyFormat("bold")}
            aria-pressed={activeFormats.bold}
          >
            <FaBold aria-hidden />
            <span className="sr-only">Bold</span>
          </button>
          <button
            type="button"
            className={`${toolbarButtonClasses} ${
              activeFormats.italic
                ? "border-sky-400/80 bg-sky-400 text-slate-950"
                : ""
            }`}
            onClick={() => applyFormat("italic")}
            aria-pressed={activeFormats.italic}
          >
            <FaItalic aria-hidden />
            <span className="sr-only">Italic</span>
          </button>
          <button
            type="button"
            className={`${toolbarButtonClasses} ${
              activeFormats.bullets
                ? "border-sky-400/80 bg-sky-400 text-slate-950"
                : ""
            }`}
            onClick={() => applyFormat("insertUnorderedList")}
            aria-pressed={activeFormats.bullets}
          >
            <FaListUl aria-hidden />
            <span className="sr-only">Bullets</span>
          </button>
        </div>
        <div
          ref={descriptionRef}
          className={`${inputClasses} min-h-[140px] text-sm`}
          contentEditable
          role="textbox"
          aria-multiline="true"
          onInput={handleDescriptionInput}
          onKeyUp={updateToolbarState}
          onMouseUp={updateToolbarState}
          suppressContentEditableWarning
        />
      </label>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          {isEditing ? "Save changes" : "Add"}
        </button>
        <button
          type="button"
          className="rounded-full border border-slate-700/70 px-5 py-2 text-sm font-semibold text-slate-200"
          onClick={onCancelEdit}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
