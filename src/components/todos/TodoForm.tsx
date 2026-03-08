"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  BsListOl,
  BsListUl,
  BsTypeBold,
  BsTypeItalic,
  BsTypeStrikethrough
} from "react-icons/bs";
import { FiCheckSquare, FiPlus, FiRepeat, FiSave, FiSquare, FiTrash2, FiX } from "react-icons/fi";

import type { Subtask, TodoInput, TodoPriority, TodoRecurrence } from "@/lib/types";

const inputClasses =
  "w-full rounded-2xl border border-slate-800/70 bg-slate-950/55 px-3.5 py-2.5 text-sm text-slate-100 shadow-sm transition-colors duration-200 ease-out focus:border-emerald-300/60 focus:bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-emerald-300/15";

const labelClasses = "flex flex-col gap-1.5";
const labelTextClasses =
  "text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400";

type TodoFormProps = {
  form: TodoInput;
  priorities: TodoPriority[];
  isEditing: boolean;
  titleHasError: boolean;
  scheduleHasError: boolean;
  onChange: (
    event:
      | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      | { target: { name: string; value: string[] } }
  ) => void;
  onDescriptionChange: (value: string) => void;
  onSubtasksChange: (subtasks: Subtask[]) => void;
  onSubmit: (event: FormEvent) => void;
  onCancelEdit: () => void;
};

export default function TodoForm({
  form,
  priorities,
  isEditing,
  titleHasError,
  scheduleHasError,
  onChange,
  onDescriptionChange,
  onSubtasksChange,
  onSubmit,
  onCancelEdit
}: TodoFormProps) {
  const [tagInput, setTagInput] = useState("");
  const [subtaskInput, setSubtaskInput] = useState("");
  const [contextTagInput, setContextTagInput] = useState("");
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(
    Boolean(form.description)
  );
  const descriptionRef = useRef<HTMLDivElement | null>(null);
  const tags = useMemo(
    () =>
      form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [form.tags]
  );
  const contextTags = useMemo(() => form.contextTags ?? [], [form.contextTags]);

  const updateTags = (nextTags: string[]) => {
    onChange({
      target: {
        name: "tags",
        value: nextTags.join(", ")
      }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleTagAdd = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return;
    if (tags.includes(trimmed)) return;
    updateTags([...tags, trimmed]);
    setTagInput("");
  };

  const handleTagRemove = (value: string) => {
    updateTags(tags.filter((tag) => tag !== value));
  };

  const updateContextTags = (nextTags: string[]) => {
    onChange({
      target: {
        name: "contextTags",
        value: nextTags
      }
    });
  };

  const handleContextTagAdd = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return;
    if (contextTags.includes(trimmed)) return;
    updateContextTags([...contextTags, trimmed]);
    setContextTagInput("");
  };

  const handleContextTagRemove = (value: string) => {
    updateContextTags(contextTags.filter((tag) => tag !== value));
  };

  useEffect(() => {
    if (form.description && !isDescriptionOpen) {
      setIsDescriptionOpen(true);
    }
  }, [form.description, isDescriptionOpen]);

  const applyInlineFormat = (command: "bold" | "italic" | "strikeThrough") => {
    const editor = descriptionRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command);
  };

  const applyListFormat = (type: "ordered" | "unordered") => {
    const editor = descriptionRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(type === "ordered" ? "insertOrderedList" : "insertUnorderedList");
  };

  const handleDescriptionInput = () => {
    const editor = descriptionRef.current;
    if (!editor) return;
    onDescriptionChange(editor.innerHTML);
  };

  const handleAddSubtask = () => {
    const trimmed = subtaskInput.trim();
    if (!trimmed) return;
    const newSubtask: Subtask = {
      id: crypto.randomUUID(),
      title: trimmed,
      completed: false
    };
    onSubtasksChange([...form.subtasks, newSubtask]);
    setSubtaskInput("");
  };

  const handleToggleSubtask = (subtaskId: string) => {
    onSubtasksChange(
      form.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      )
    );
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    onSubtasksChange(form.subtasks.filter((s) => s.id !== subtaskId));
  };

  useEffect(() => {
    const editor = descriptionRef.current;
    if (!editor) return;
    if (editor.innerHTML !== form.description) {
      editor.innerHTML = form.description;
    }
  }, [form.description]);

  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      <div className="modal-header">
        <h2 className="text-xl font-semibold text-white">
          {isEditing ? "Edit todo" : "Add a new todo"}
        </h2>
      </div>
      <div>
        <label className={labelClasses}>
          <span className={labelTextClasses}>Title</span>
          <input
            name="title"
            placeholder="What would you like add?"
            value={form.title}
            onChange={onChange}
            maxLength={40}
            required
            className={`${inputClasses} ${
              titleHasError ? "border-rose-500/80 text-rose-100" : ""
            }`}
            aria-invalid={titleHasError}
          />
        </label>
        <div className="mt-5 grid gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={labelClasses}>
              <span className={labelTextClasses}>Scheduled date</span>
              <input
                name="scheduledDate"
                type="date"
                value={form.scheduledDate}
                onChange={onChange}
                required
                className={`${inputClasses} ${
                  scheduleHasError ? "border-rose-500/80 text-rose-100" : ""
                }`}
                aria-invalid={scheduleHasError}
              />
            </label>
            <label className={labelClasses}>
              <span className={labelTextClasses}>Scheduled time</span>
              <input
                name="scheduledTime"
                type="time"
                value={form.scheduledTime}
                onChange={onChange}
                required
                className={`${inputClasses} ${
                  scheduleHasError ? "border-rose-500/80 text-rose-100" : ""
                }`}
                aria-invalid={scheduleHasError}
              />
            </label>
          </div>
          <div className={labelClasses}>
            <span className={labelTextClasses}>
              <FiRepeat className="inline h-3 w-3 mr-1" aria-hidden />
              Repeat
            </span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: "none", label: "No repeat" },
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: "Monthly" }
                ] as { value: TodoRecurrence; label: string }[]
              ).map((option) => {
                const isActive = form.recurrence === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      onChange({
                        target: { name: "recurrence", value: option.value }
                      } as React.ChangeEvent<HTMLSelectElement>)
                    }
                    aria-pressed={isActive}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                      isActive
                        ? "border-sky-400/60 bg-sky-400/15 text-sky-100"
                        : "border-slate-800/80 text-slate-400 hover:border-slate-600/70 hover:text-slate-200"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={labelClasses}>
              <span className={labelTextClasses}>Priority</span>
              <div className="flex flex-wrap gap-2">
                {priorities.map((priority) => {
                  const isActive = form.priority === priority;
                  const colorClasses =
                    priority === "high"
                      ? "border-rose-400/60 text-rose-200 shadow-[0_0_16px_rgba(244,63,94,0.35)]"
                      : priority === "medium"
                      ? "border-amber-400/60 text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.25)]"
                      : "border-emerald-400/60 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.25)]";
                  return (
                    <button
                      key={priority}
                      type="button"
                      onClick={() =>
                        onChange({
                          target: { name: "priority", value: priority }
                        } as React.ChangeEvent<HTMLSelectElement>)
                      }
                      aria-pressed={isActive}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase transition ${
                        isActive
                          ? `${colorClasses} bg-white/5`
                          : "border-slate-800/80 text-slate-400 hover:border-slate-600/70 hover:text-slate-200"
                      }`}
                    >
                      {priority}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={labelClasses}>
              <span className={labelTextClasses}>Tags</span>
              <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800/70 bg-slate-950/55 px-3 py-3 shadow-sm transition-colors duration-200 ease-out focus-within:border-emerald-300/50 focus-within:bg-slate-950/70 focus-within:ring-2 focus-within:ring-emerald-300/10">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/60 px-3 py-1 text-xs text-slate-200 transition hover:border-emerald-300/80 hover:text-emerald-100"
                    onClick={() => handleTagRemove(tag)}
                  >
                    {tag}
                    <span className="text-[0.65rem] text-slate-400">×</span>
                  </button>
                ))}
                <input
                  name="tags"
                  placeholder="Add tag"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onBlur={() => handleTagAdd(tagInput)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === "Tab") {
                      event.preventDefault();
                      handleTagAdd(tagInput);
                    }
                  }}
                  enterKeyHint="done"
                  className="min-w-[120px] flex-1 bg-transparent text-sm text-slate-100 outline-none"
                />
              </div>
            </div>
          </div>
          <div className={labelClasses}>
            <span className={labelTextClasses}>Context tags</span>
            <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800/70 bg-slate-950/55 px-3 py-3 shadow-sm transition-colors duration-200 ease-out focus-within:border-emerald-300/50 focus-within:bg-slate-950/70 focus-within:ring-2 focus-within:ring-emerald-300/10">
              {contextTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/60 px-3 py-1 text-xs text-slate-200 transition hover:border-emerald-300/80 hover:text-emerald-100"
                  onClick={() => handleContextTagRemove(tag)}
                >
                  {tag}
                  <span className="text-[0.65rem] text-slate-400">×</span>
                </button>
              ))}
              <input
                name="contextTags"
                placeholder="Add context tag"
                value={contextTagInput}
                onChange={(event) => setContextTagInput(event.target.value)}
                onBlur={() => handleContextTagAdd(contextTagInput)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === "Tab") {
                    event.preventDefault();
                    handleContextTagAdd(contextTagInput);
                  }
                }}
                enterKeyHint="done"
                className="min-w-[140px] flex-1 bg-transparent text-sm text-slate-100 outline-none"
              />
            </div>
          </div>
        </div>
        <div className="mt-5">
          {!isDescriptionOpen ? (
            <button
              type="button"
              className="w-full rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-300 transition hover:border-emerald-400/60 hover:text-emerald-100"
              onClick={() => setIsDescriptionOpen(true)}
            >
              + Add description
            </button>
          ) : (
            <label className={labelClasses}>
              <span className={labelTextClasses}>Description</span>
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800/70 bg-slate-950/55 px-3 py-2 shadow-sm transition-colors duration-200 ease-out focus-within:border-emerald-300/50 focus-within:bg-slate-950/70 focus-within:ring-2 focus-within:ring-emerald-300/10">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-slate-700/70 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-emerald-400/70 hover:text-emerald-100"
                  onClick={() => applyInlineFormat("bold")}
                  aria-label="Bold"
                >
                  <BsTypeBold aria-hidden />
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-slate-700/70 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-emerald-400/70 hover:text-emerald-100"
                  onClick={() => applyInlineFormat("italic")}
                  aria-label="Italic"
                >
                  <BsTypeItalic aria-hidden />
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-slate-700/70 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-emerald-400/70 hover:text-emerald-100"
                  onClick={() => applyInlineFormat("strikeThrough")}
                  aria-label="Strikethrough"
                >
                  <BsTypeStrikethrough aria-hidden />
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-slate-700/70 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-emerald-400/70 hover:text-emerald-100"
                  onClick={() => applyListFormat("unordered")}
                  aria-label="Bulleted list"
                >
                  <BsListUl aria-hidden />
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-slate-700/70 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-emerald-400/70 hover:text-emerald-100"
                  onClick={() => applyListFormat("ordered")}
                  aria-label="Numbered list"
                >
                  <BsListOl aria-hidden />
                </button>
              </div>
              <div className="relative">
                {form.description.trim() ? null : (
                  <span className="pointer-events-none absolute left-4 top-3 text-sm text-slate-500">
                    Add helpful context (optional)
                  </span>
                )}
                <div
                  ref={descriptionRef}
                  className={`${inputClasses} max-h-36 min-h-[6.5rem] overflow-y-auto [&_em]:text-slate-100 [&_ol]:list-decimal [&_ol]:pl-5 [&_s]:line-through [&_strike]:line-through [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-5`}
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline="true"
                  onInput={handleDescriptionInput}
                  onBlur={handleDescriptionInput}
                />
              </div>
            </label>
          )}
        </div>
        <div className="mt-5">
          <div className={labelClasses}>
            <span className={labelTextClasses}>Subtasks</span>
            <div className="grid gap-2">
              {form.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 rounded-2xl border border-slate-800/70 bg-slate-950/60 px-3 py-2"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(subtask.id)}
                    className="flex-shrink-0 text-slate-400 hover:text-emerald-300 transition"
                  >
                    {subtask.completed ? (
                      <FiCheckSquare className="h-4 w-4 text-emerald-400" aria-hidden />
                    ) : (
                      <FiSquare className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      subtask.completed
                        ? "text-slate-500 line-through"
                        : "text-slate-200"
                    }`}
                  >
                    {subtask.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(subtask.id)}
                    className="flex-shrink-0 text-slate-500 hover:text-rose-300 transition"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Add a subtask"
                  className={`${inputClasses} flex-1`}
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-700/70 text-slate-300 transition hover:border-emerald-400/60 hover:text-emerald-200"
                >
                  <FiPlus className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 -mx-5 mt-6 grid grid-cols-2 gap-2 border-t border-slate-900/60 bg-slate-950/80 px-5 backdrop-blur">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-1 rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.45)] transition hover:bg-emerald-300 active:scale-[0.98]"
        >
          {isEditing ? <FiSave aria-hidden /> : <FiPlus aria-hidden />}
          <span>{isEditing ? "Save" : "Save"}</span>
        </button>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1 rounded-full border border-slate-700/70 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500/80 hover:text-white active:scale-[0.98]"
          onClick={onCancelEdit}
        >
          <FiX aria-hidden />
          <span>Cancel</span>
        </button>
      </div>
    </form>
  );
}
