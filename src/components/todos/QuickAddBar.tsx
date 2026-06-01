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
      className="surface-card flex items-center gap-2 px-3 py-2 transition-colors duration-200 ease-out focus-within:border-[var(--accent)]"
    >
      <FiZap aria-hidden className="flex-shrink-0 text-[var(--accent)]" />
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Quick add — e.g. Gym tomorrow at 6pm #health !high"
        aria-label="Quick add a todo using natural language"
        className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-faint outline-none"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="btn-pop flex h-8 w-8 flex-shrink-0 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Add todo"
      >
        <FiPlus className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}
