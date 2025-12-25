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
  onItemChange: (
    index: number,
    field: keyof RoutineInput["items"][number],
    value: string
  ) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
};

const parseTagList = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

type RoutineItemEditorProps = {
  item: RoutineInput["items"][number];
  index: number;
  priorities: TodoPriority[];
  onItemChange: RoutineFormProps["onItemChange"];
  onRemoveItem: RoutineFormProps["onRemoveItem"];
};

function RoutineItemEditor({
  item,
  index,
  priorities,
  onItemChange,
  onRemoveItem
}: RoutineItemEditorProps) {
  const [tagInput, setTagInput] = useState("");
  const [contextTagInput, setContextTagInput] = useState("");
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(
    Boolean(item.description)
  );
  const descriptionRef = useRef<HTMLDivElement | null>(null);

  const tags = useMemo(() => parseTagList(item.tags), [item.tags]);
  const contextTags = useMemo(() => parseTagList(item.contextTags), [item.contextTags]);

  const updateTags = (nextTags: string[]) => {
    onItemChange(index, "tags", nextTags.join(", "));
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
    onItemChange(index, "contextTags", nextTags.join(", "));
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
    if (item.description && !isDescriptionOpen) {
      setIsDescriptionOpen(true);
    }
  }, [item.description, isDescriptionOpen]);

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
    onItemChange(index, "description", editor.innerHTML);
  };

  useEffect(() => {
    const editor = descriptionRef.current;
    if (!editor) return;
    if (editor.innerHTML !== item.description) {
      editor.innerHTML = item.description;
    }
  }, [item.description]);

  return (
    <div className="grid gap-3 rounded-3xl border border-slate-900/70 bg-slate-950/70 p-4">
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
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800/70 bg-slate-950/60 px-3 py-3">
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
      </label>
      <label className="grid gap-2">
        <span className={labelTextClasses}>Context tags</span>
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800/70 bg-slate-950/60 px-3 py-3">
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
      </label>
      {!isDescriptionOpen ? (
        <button
          type="button"
          className="w-full rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-300 transition hover:border-emerald-400/60 hover:text-emerald-100"
          onClick={() => setIsDescriptionOpen(true)}
        >
          + Add description
        </button>
      ) : (
        <label className="grid gap-2">
          <span className={labelTextClasses}>Description</span>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800/70 bg-slate-950/60 px-3 py-2">
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
            {item.description.trim() ? null : (
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
  );
}

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
            <RoutineItemEditor
              key={`routine-item-${index}`}
              item={item}
              index={index}
              priorities={priorities}
              onItemChange={onItemChange}
              onRemoveItem={onRemoveItem}
            />
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
