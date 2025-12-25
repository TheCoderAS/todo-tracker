"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { FiPlus, FiX } from "react-icons/fi";

import type { Habit, HabitFrequency, HabitInput, HabitType } from "@/lib/types";

const inputClasses =
  "w-full rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 transition focus:border-emerald-300/50 focus:outline-none focus:ring-1 focus:ring-emerald-300/20";

const labelClasses = "flex flex-col gap-2";
const labelTextClasses = "text-xs font-semibold capitalize text-slate-300";

const days = [
  { id: 0, label: "Sun" },
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" }
];

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const frequencyOptions: { value: HabitFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" }
];

const habitTypeOptions: { value: HabitType; label: string; helper: string }[] = [
  { value: "positive", label: "Build", helper: "Do something you want more of." },
  { value: "avoid", label: "Avoid", helper: "Stay on track by avoiding a habit." }
];

type HabitFormProps = {
  form: HabitInput;
  graceMissesInput: string;
  habits: Habit[];
  isEditing?: boolean;
  onChange: (
    event:
      | ChangeEvent<HTMLInputElement | HTMLSelectElement>
      | { target: { name: string; value: string[] } }
  ) => void;
  onGraceMissesChange: (value: string) => void;
  onGraceMissesBlur: () => void;
  onToggleDay: (dayIndex: number) => void;
  onDayOfMonthChange: (dayOfMonth: number) => void;
  onMonthChange: (month: number) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
};

export default function HabitForm({
  form,
  graceMissesInput,
  habits,
  isEditing = false,
  onChange,
  onGraceMissesChange,
  onGraceMissesBlur,
  onToggleDay,
  onDayOfMonthChange,
  onMonthChange,
  onSubmit,
  onCancel
}: HabitFormProps) {
  const [contextTagInput, setContextTagInput] = useState("");
  const contextTags = useMemo(() => form.contextTags ?? [], [form.contextTags]);
  const contextTagSuggestions = useMemo(
    () => ["work", "home", "health", "personal", "family", "learning"],
    []
  );
  const suggestedContextTags = useMemo(() => {
    if (!contextTagInput.trim()) return contextTagSuggestions;
    return contextTagSuggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(contextTagInput.toLowerCase())
    );
  }, [contextTagInput, contextTagSuggestions]);

  const showWeeklyDays = form.frequency === "weekly";
  const showMonthlyDay = form.frequency === "monthly";
  const showYearlySchedule = form.frequency === "yearly";
  const habitOptions = useMemo(
    () =>
      habits
        .filter((habit) => !habit.archivedAt)
        .sort((a, b) => a.title.localeCompare(b.title)),
    [habits]
  );
  const dayOfMonthValue = showYearlySchedule
    ? form.reminderDays.length >= 2
      ? form.reminderDays[1]
      : form.reminderDays[0] ?? new Date().getDate()
    : form.reminderDays.length > 0
    ? form.reminderDays[0]
    : new Date().getDate();
  const monthValue = showYearlySchedule
    ? form.reminderDays.length >= 2
      ? form.reminderDays[0]
      : new Date().getMonth() + 1
    : new Date().getMonth() + 1;

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

  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      <h2 className="text-xl font-semibold text-white">
        {isEditing ? "Edit habit" : "Add a new habit"}
      </h2>
      <label className={labelClasses}>
        <span className={labelTextClasses}>Title</span>
        <input
          name="title"
          placeholder="What habit are you building?"
          value={form.title}
          onChange={onChange}
          maxLength={40}
          required
          className={inputClasses}
        />
      </label>
      <div className={labelClasses}>
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
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestedContextTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleContextTagAdd(tag)}
              className="rounded-full border border-slate-800/80 px-3 py-1 text-xs text-slate-400 transition hover:border-slate-500/70 hover:text-slate-200"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClasses}>
          <span className={labelTextClasses}>Habit type</span>
          <select
            name="habitType"
            value={form.habitType}
            onChange={onChange}
            className={inputClasses}
          >
            {habitTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="text-[0.65rem] text-slate-500">
            {habitTypeOptions.find((option) => option.value === form.habitType)?.helper}
          </span>
        </label>
        <label className={labelClasses}>
          <span className={labelTextClasses}>Frequency</span>
          <select
            name="frequency"
            value={form.frequency}
            onChange={onChange}
            className={inputClasses}
          >
            {frequencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClasses}>
          <span className={labelTextClasses}>Grace misses per week</span>
          <input
            name="graceMisses"
            type="number"
            min={0}
            max={7}
            value={graceMissesInput}
            onChange={(event) => onGraceMissesChange(event.target.value)}
            onBlur={onGraceMissesBlur}
            className={inputClasses}
          />
        </label>
        <label className={labelClasses}>
          <span className={labelTextClasses}>Reminder time</span>
          <input
            name="reminderTime"
            type="time"
            value={form.reminderTime}
            onChange={onChange}
            required
            className={inputClasses}
          />
        </label>
        <label className={labelClasses}>
          <span className={labelTextClasses}>Trigger next habit</span>
          <select
            name="triggerAfterHabitId"
            value={form.triggerAfterHabitId ?? ""}
            onChange={onChange}
            className={inputClasses}
          >
            <option value="">No linked habit</option>
            {habitOptions.map((habit) => (
              <option key={habit.id} value={habit.id}>
                {habit.title}
              </option>
            ))}
          </select>
          <span className="text-[0.65rem] text-slate-500">
            Choose a habit to prompt right after this one is completed.
          </span>
        </label>
      </div>
      {showWeeklyDays ? (
        <div className={labelClasses}>
          <span className={labelTextClasses}>Repeat days</span>
          <div className="flex flex-wrap gap-2">
            {days.map((day) => {
              const isActive = form.reminderDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => onToggleDay(day.id)}
                  aria-pressed={isActive}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "border-sky-400/70 bg-sky-400/20 text-sky-100"
                      : "border-slate-800/70 text-slate-400 hover:border-slate-600/70 hover:text-slate-200"
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {showMonthlyDay ? (
        <label className={labelClasses}>
          <span className={labelTextClasses}>Repeat on day</span>
          <select
            name="reminderDayOfMonth"
            value={dayOfMonthValue}
            onChange={(event) => onDayOfMonthChange(Number(event.target.value))}
            className={inputClasses}
          >
            {Array.from({ length: 31 }).map((_, index) => {
              const day = index + 1;
              return (
                <option key={day} value={day}>
                  Day {day}
                </option>
              );
            })}
          </select>
        </label>
      ) : form.frequency === "daily" ? (
        <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
          Runs every day.
        </div>
      ) : null}
      {showYearlySchedule ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClasses}>
            <span className={labelTextClasses}>Repeat in month</span>
            <select
              name="reminderMonth"
              value={monthValue}
              onChange={(event) => onMonthChange(Number(event.target.value))}
              className={inputClasses}
            >
              {months.map((month, index) => {
                const value = index + 1;
                return (
                  <option key={month} value={value}>
                    {month}
                  </option>
                );
              })}
            </select>
          </label>
          <label className={labelClasses}>
            <span className={labelTextClasses}>Repeat on day</span>
            <select
              name="reminderDayOfMonth"
              value={dayOfMonthValue}
              onChange={(event) => onDayOfMonthChange(Number(event.target.value))}
              className={inputClasses}
            >
              {Array.from({ length: 31 }).map((_, index) => {
                const day = index + 1;
                return (
                  <option key={day} value={day}>
                    Day {day}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
      ) : null}
      <div className="sticky bottom-0 -mx-5 mt-6 grid grid-cols-2 gap-2 border-t border-slate-900/60 bg-slate-950/80 px-5 backdrop-blur">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-1 rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.45)] transition hover:bg-emerald-300 active:scale-[0.98]"
        >
          <FiPlus aria-hidden />
          <span>{isEditing ? "Update" : "Save"}</span>
        </button>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1 rounded-full border border-slate-700/70 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500/80 hover:text-white active:scale-[0.98]"
          onClick={onCancel}
        >
          <FiX aria-hidden />
          <span>Cancel</span>
        </button>
      </div>
    </form>
  );
}
