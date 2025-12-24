"use client";

import type { ChangeEvent, FormEvent } from "react";
import { FiPlus, FiX } from "react-icons/fi";

import type { HabitFrequency, HabitInput } from "@/lib/types";

const inputClasses =
  "w-full rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 transition focus:border-emerald-400/70 focus:outline-none focus:ring-1 focus:ring-emerald-400/40";

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

const frequencyOptions: { value: HabitFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "half-yearly", label: "Half yearly" },
  { value: "yearly", label: "Yearly" }
];

type HabitFormProps = {
  form: HabitInput;
  isEditing?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onToggleDay: (dayIndex: number) => void;
  onDayOfMonthChange: (dayOfMonth: number) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
};

export default function HabitForm({
  form,
  isEditing = false,
  onChange,
  onToggleDay,
  onDayOfMonthChange,
  onSubmit,
  onCancel
}: HabitFormProps) {
  const showWeeklyDays = form.frequency === "weekly";
  const showMonthlyDay = ["monthly", "quarterly", "half-yearly", "yearly"].includes(
    form.frequency
  );
  const dayOfMonthValue =
    form.reminderDays.length > 0 ? form.reminderDays[0] : new Date().getDate();

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
      <div className="grid gap-4 sm:grid-cols-2">
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
