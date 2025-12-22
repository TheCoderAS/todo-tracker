"use client";

import { useMemo, useState } from "react";
import {
  FiArrowDown,
  FiArrowUp,
  FiCheck,
  FiFilter,
  FiRotateCcw,
  FiZap,
  FiX
} from "react-icons/fi";

import Modal from "@/components/ui/Modal";
import type { Todo, TodoPriority } from "@/lib/types";

export type FilterDraft = {
  status: "all" | Todo["status"];
  priority: "all" | TodoPriority;
  sortBy: "scheduled" | "completed" | "priority" | "created" | "manual";
  sortOrder: "asc" | "desc";
  datePreset: "all" | "today" | "tomorrow" | "week" | "spillover" | "upcoming" | "custom";
  selectedDate: string;
};

type FiltersModalProps = {
  isOpen: boolean;
  filterDraft: FilterDraft;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  onDraftChange: (nextDraft: FilterDraft) => void;
};

const statusOptions: { value: FilterDraft["status"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" }
];

const priorityOptions: { value: FilterDraft["priority"]; label: string }[] = [
  { value: "all", label: "None" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" }
];

export default function FiltersModal({
  isOpen,
  filterDraft,
  onClose,
  onApply,
  onReset,
  onDraftChange
}: FiltersModalProps) {
  const [applyBounce, setApplyBounce] = useState(false);
  const showDatePicker = filterDraft.datePreset === "custom";

  const sortByOptions = useMemo(() => {
    const base = [
      { value: "scheduled", label: "Scheduled date" },
      { value: "created", label: "Created date" },
      { value: "priority", label: "Priority" },
      { value: "manual", label: "Manual order" }
    ];
    if (filterDraft.status === "completed") {
      return [{ value: "completed", label: "Completion date" }, ...base];
    }
    return base;
  }, [filterDraft.status]);

  const quickPresets = [
    {
      id: "today-only",
      label: "Today only",
      apply: () =>
        onDraftChange({
          ...filterDraft,
          status: "pending",
          priority: "all",
          datePreset: "today",
          sortBy: "scheduled",
          sortOrder: "asc"
        })
    },
    {
      id: "urgent-first",
      label: "Urgent first",
      apply: () =>
        onDraftChange({
          ...filterDraft,
          status: "all",
          priority: "all",
          datePreset: "all",
          sortBy: "priority",
          sortOrder: "asc"
        })
    },
    {
      id: "completed-only",
      label: "Completed only",
      apply: () =>
        onDraftChange({
          ...filterDraft,
          status: "completed",
          priority: "all",
          datePreset: "all",
          sortBy: "completed",
          sortOrder: "desc"
        })
    }
  ];

  const handleApply = () => {
    setApplyBounce(true);
    onApply();
    window.setTimeout(() => setApplyBounce(false), 500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Filter todos" variant="bottom-sheet">
      <div className="grid gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Filter & sorting
            </p>
            <h3 className="text-xl font-semibold text-white">Refine your focus</h3>
          </div>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-700/70 text-slate-200 transition hover:border-slate-500 active:scale-95"
            onClick={onClose}
            aria-label="Close filters"
          >
            <FiX aria-hidden />
          </button>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-800/60 bg-slate-950/70 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <FiZap aria-hidden className="text-emerald-300" />
            Smart filters
          </div>
          <div className="flex flex-wrap gap-2">
            {quickPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="flex items-center gap-2 rounded-full border border-slate-800/70 bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-600/70 hover:text-white active:scale-95"
                onClick={preset.apply}
              >
                <FiFilter aria-hidden className="text-slate-400" />
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          <div className="grid gap-3">
            <h4 className="text-sm font-semibold text-white">Status</h4>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`flex h-11 items-center justify-center rounded-full border px-4 text-sm font-semibold transition active:scale-95 ${
                    filterDraft.status === option.value
                      ? "border-sky-400/60 bg-sky-400/15 text-sky-100"
                      : "border-slate-800/70 bg-slate-950/50 text-slate-300 hover:border-slate-600/70 hover:text-white"
                  }`}
                  onClick={() =>
                    onDraftChange({
                      ...filterDraft,
                      status: option.value,
                      sortBy:
                        option.value === "completed"
                          ? filterDraft.sortBy === "completed"
                            ? filterDraft.sortBy
                            : "completed"
                          : filterDraft.sortBy === "completed"
                          ? "scheduled"
                          : filterDraft.sortBy
                    })
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <h4 className="text-sm font-semibold text-white">Priority</h4>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`flex h-11 items-center justify-center rounded-full border px-4 text-sm font-semibold transition active:scale-95 ${
                    filterDraft.priority === option.value
                      ? "border-amber-400/60 bg-amber-400/15 text-amber-100"
                      : "border-slate-800/70 bg-slate-950/50 text-slate-300 hover:border-slate-600/70 hover:text-white"
                  }`}
                  onClick={() =>
                    onDraftChange({
                      ...filterDraft,
                      priority: option.value
                    })
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <h4 className="text-sm font-semibold text-white">Date filter</h4>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: "all", label: "Any" },
                  { value: "today", label: "Today" },
                  { value: "tomorrow", label: "Tomorrow" },
                  { value: "week", label: "This week" },
                  { value: "spillover", label: "Overdue" },
                  { value: "upcoming", label: "Upcoming" },
                  { value: "custom", label: "Custom" }
                ] as { value: FilterDraft["datePreset"]; label: string }[]
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`flex h-11 items-center justify-center rounded-full border px-4 text-sm font-semibold transition active:scale-95 ${
                    filterDraft.datePreset === option.value
                      ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
                      : "border-slate-800/70 bg-slate-950/50 text-slate-300 hover:border-slate-600/70 hover:text-white"
                  }`}
                  onClick={() =>
                    onDraftChange({
                      ...filterDraft,
                      datePreset: option.value,
                      selectedDate: option.value === "custom" ? filterDraft.selectedDate : ""
                    })
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
            {showDatePicker ? (
              <label className="grid gap-2 text-xs font-semibold text-slate-300">
                Choose date
                <input
                  type="date"
                  value={filterDraft.selectedDate}
                  onChange={(event) =>
                    onDraftChange({
                      ...filterDraft,
                      selectedDate: event.target.value,
                      datePreset: "custom"
                    })
                  }
                  className="h-11 rounded-2xl border border-slate-800/70 bg-slate-950/60 px-3 text-sm text-slate-100 transition focus:border-slate-500"
                />
              </label>
            ) : null}
          </div>

          <div className="grid gap-3">
            <h4 className="text-sm font-semibold text-white">Sort by</h4>
            <div className="grid gap-3 rounded-2xl border border-slate-800/60 bg-slate-950/60 p-3">
              <div className="flex flex-wrap gap-2">
                {sortByOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`flex h-11 items-center justify-center rounded-full border px-4 text-sm font-semibold transition active:scale-95 ${
                      filterDraft.sortBy === option.value
                        ? "border-sky-400/60 bg-sky-400/15 text-sky-100"
                        : "border-slate-800/70 bg-slate-950/50 text-slate-300 hover:border-slate-600/70 hover:text-white"
                    }`}
                    onClick={() =>
                      onDraftChange({
                        ...filterDraft,
                        sortBy: option.value
                      })
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-300">
                <span>Sort order</span>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-slate-500 active:scale-95"
                  onClick={() =>
                    onDraftChange({
                      ...filterDraft,
                      sortOrder: filterDraft.sortOrder === "asc" ? "desc" : "asc"
                    })
                  }
                >
                  {filterDraft.sortOrder === "asc" ? (
                    <FiArrowUp aria-hidden />
                  ) : (
                    <FiArrowDown aria-hidden />
                  )}
                  {filterDraft.sortOrder === "asc" ? "Ascending" : "Descending"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 -mx-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-900/80 bg-slate-950/95 px-6 py-4">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white active:scale-95"
            onClick={onReset}
          >
            <FiRotateCcw aria-hidden />
            Reset defaults
          </button>
          <button
            type="button"
            className={`flex h-12 min-w-[10rem] items-center justify-center gap-2 rounded-full bg-emerald-400 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-300 active:scale-95 ${
              applyBounce ? "animate-[bounce_0.5s_ease-out]" : ""
            }`}
            onClick={handleApply}
            aria-label="Apply filters"
          >
            <FiCheck aria-hidden />
            Apply filters
          </button>
        </div>
      </div>
    </Modal>
  );
}
