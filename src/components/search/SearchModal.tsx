import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiClock, FiFlag, FiHash, FiList, FiSearch, FiX, FiZap } from "react-icons/fi";

import type { Habit, Todo } from "@/lib/types";

type SearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  todos: Todo[];
  habits: Habit[];
  onSelectTodo?: (todo: Todo) => void;
  onSelectHabit?: (habit: Habit) => void;
};

type SearchResult =
  | { type: "todo"; item: Todo }
  | { type: "habit"; item: Habit };

const highlightMatch = (text: string, query: string) => {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="rounded bg-sky-400/30 text-sky-100 px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const formatDate = (timestamp: Todo["scheduledDate"]) => {
  if (!timestamp) return "";
  const date = timestamp.toDate();
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export default function SearchModal({
  isOpen,
  onClose,
  todos,
  habits,
  onSelectTodo,
  onSelectHabit
}: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const results = useMemo<SearchResult[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const todoResults: SearchResult[] = todos
      .filter((todo) => {
        const matchesTitle = todo.title.toLowerCase().includes(q);
        const matchesTags = todo.tags.some((tag) => tag.toLowerCase().includes(q));
        const matchesDescription = todo.description?.toLowerCase().includes(q);
        return matchesTitle || matchesTags || matchesDescription;
      })
      .map((item) => ({ type: "todo" as const, item }));

    const habitResults: SearchResult[] = habits
      .filter((habit) => {
        const matchesTitle = habit.title.toLowerCase().includes(q);
        return matchesTitle;
      })
      .map((item) => ({ type: "habit" as const, item }));

    return [...todoResults, ...habitResults].slice(0, 20);
  }, [searchQuery, todos, habits]);

  useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === "todo") {
      navigate("/todos");
      onSelectTodo?.(result.item);
    } else {
      navigate("/todos");
      onSelectHabit?.(result.item);
    }
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        event.preventDefault();
        if (results[activeIndex]) {
          handleSelect(results[activeIndex]);
        }
        break;
      case "Escape":
        event.preventDefault();
        onClose();
        break;
    }
  };

  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg mx-4 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/95 shadow-2xl shadow-slate-950/80"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-slate-800/60 px-4 py-3">
          <FiSearch className="flex-shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search todos and habits..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
          />
          <div className="flex items-center gap-2">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-slate-500 hover:text-slate-300 transition"
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-700/70 bg-slate-900/60 px-1.5 py-0.5 text-[0.6rem] text-slate-500">
              ESC
            </kbd>
          </div>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto">
          {searchQuery.trim() && results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No results for &ldquo;{searchQuery}&rdquo;
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.item.id}`}
                  data-index={index}
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    index === activeIndex
                      ? "bg-sky-400/15 text-sky-100"
                      : "text-slate-300 hover:bg-slate-900/60"
                  }`}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${
                      result.type === "todo"
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : "border-sky-400/30 bg-sky-400/10 text-sky-300"
                    }`}
                  >
                    {result.type === "todo" ? (
                      <FiList className="h-3.5 w-3.5" />
                    ) : (
                      <FiZap className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">
                      {highlightMatch(result.item.title, searchQuery)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[0.65rem] uppercase text-slate-500">
                        {result.type === "todo" ? "Task" : "Habit"}
                      </span>
                      {result.type === "todo" && (result.item as Todo).scheduledDate && (
                        <span className="flex items-center gap-1 text-[0.65rem] text-slate-500">
                          <FiClock className="h-2.5 w-2.5" />
                          {formatDate((result.item as Todo).scheduledDate)}
                        </span>
                      )}
                      {result.type === "todo" && (result.item as Todo).priority === "high" && (
                        <span className="flex items-center gap-1 text-[0.65rem] text-amber-400">
                          <FiFlag className="h-2.5 w-2.5" />
                          High
                        </span>
                      )}
                      {result.type === "todo" &&
                        (result.item as Todo).tags.length > 0 && (
                          <span className="flex items-center gap-1 text-[0.65rem] text-slate-500">
                            <FiHash className="h-2.5 w-2.5" />
                            {(result.item as Todo).tags.slice(0, 2).join(", ")}
                          </span>
                        )}
                    </div>
                  </div>
                  {result.type === "todo" && (result.item as Todo).status === "completed" && (
                    <span className="flex-shrink-0 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[0.6rem] text-emerald-300">
                      Done
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : !searchQuery.trim() ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              Type to search across todos and habits
            </div>
          ) : null}
        </div>

        {results.length > 0 && (
          <div className="border-t border-slate-800/60 px-4 py-2 text-[0.65rem] text-slate-500">
            <span className="hidden sm:inline">
              <kbd className="rounded border border-slate-700/70 bg-slate-900/60 px-1 py-0.5 mr-0.5">↑</kbd>
              <kbd className="rounded border border-slate-700/70 bg-slate-900/60 px-1 py-0.5 mr-1">↓</kbd>
              navigate
              <span className="mx-2">·</span>
              <kbd className="rounded border border-slate-700/70 bg-slate-900/60 px-1 py-0.5 mr-1">↵</kbd>
              select
            </span>
            <span className="sm:hidden">Tap a result to open</span>
          </div>
        )}
      </div>
    </div>
  );
}
