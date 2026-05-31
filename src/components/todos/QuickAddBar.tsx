import { useState } from "react";
import type { FormEvent } from "react";
import { FiPlus, FiZap } from "react-icons/fi";

type QuickAddBarProps = {
  onQuickAdd: (input: string) => void | Promise<void>;
  disabled?: boolean;
};

/**
 * Natural-language quick-add: type something like
 * "Pay rent tomorrow at 5pm #finance !high" and press Enter.
 */
export default function QuickAddBar({ onQuickAdd, disabled }: QuickAddBarProps) {
  const [value, setValue] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    await onQuickAdd(trimmed);
    setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-2xl border border-slate-800/70 bg-slate-950/55 px-3 py-2 shadow-sm transition-colors duration-200 ease-out focus-within:border-emerald-300/50 focus-within:bg-slate-950/70 focus-within:ring-2 focus-within:ring-emerald-300/10"
    >
      <FiZap aria-hidden className="flex-shrink-0 text-emerald-300/80" />
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Quick add — e.g. Gym tomorrow at 6pm #health !high"
        aria-label="Quick add a todo using natural language"
        className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-emerald-400/50 text-emerald-200 transition hover:border-emerald-300/70 hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Add todo"
      >
        <FiPlus className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}
