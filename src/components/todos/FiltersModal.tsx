"use client";

import { FiCheck, FiRotateCcw, FiX } from "react-icons/fi";

import Modal from "@/components/ui/Modal";
import type { Todo, TodoPriority } from "@/lib/types";

export type FilterDraft = {
  status: "all" | Todo["status"];
  priority: "all" | TodoPriority;
  sortBy: "scheduled" | "completed";
  sortOrder: "asc" | "desc";
  datePreset: "all" | "today" | "spillover" | "upcoming" | "custom";
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

export default function FiltersModal({
  isOpen,
  filterDraft,
  onClose,
  onApply,
  onReset,
  onDraftChange
}: FiltersModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Filter todos">
      <div className="grid gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Filter & sorting</h3>
            <p className="text-xs text-slate-400">
              Adjust status, priority, and date ordering.
            </p>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700/70 text-slate-200 transition hover:border-slate-500"
            onClick={onClose}
            aria-label="Close filters"
          >
            <FiX aria-hidden />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1 text-xs font-semibold text-slate-400">
            Status
            <select
              value={filterDraft.status}
              onChange={(event) =>
                onDraftChange((() => {
                  const nextStatus = event.target.value as "all" | Todo["status"];
                  const nextSortBy =
                    nextStatus === "completed" ? filterDraft.sortBy : "scheduled";
                  return {
                    ...filterDraft,
                    status: nextStatus,
                    sortBy: nextSortBy
                  };
                })())
              }
              className="rounded-2xl border border-slate-800/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-400">
            Date filter
            <select
              value={filterDraft.datePreset}
              onChange={(event) =>
                onDraftChange({
                  ...filterDraft,
                  datePreset: event.target.value as FilterDraft["datePreset"],
                  selectedDate: ""
                })
              }
              className="rounded-2xl border border-slate-800/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="spillover">Spillover</option>
              <option value="upcoming">Upcoming</option>
              <option value="custom">Select date</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-400 sm:col-span-2">
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
              className="rounded-2xl border border-slate-800/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-400">
            Priority
            <select
              value={filterDraft.priority}
              onChange={(event) =>
                onDraftChange({
                  ...filterDraft,
                  priority: event.target.value as "all" | TodoPriority
                })
              }
              className="rounded-2xl border border-slate-800/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-400">
            Sort by date
            <select
              value={filterDraft.sortBy}
              onChange={(event) =>
                onDraftChange({
                  ...filterDraft,
                  sortBy: event.target.value as "scheduled" | "completed"
                })
              }
              className="rounded-2xl border border-slate-800/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            >
              <option value="scheduled">Scheduled date</option>
              {filterDraft.status === "completed" ? (
                <option value="completed">Completion date</option>
              ) : null}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-400">
            Sort order
            <select
              value={filterDraft.sortOrder}
              onChange={(event) =>
                onDraftChange({
                  ...filterDraft,
                  sortOrder: event.target.value as "asc" | "desc"
                })
              }
              className="rounded-2xl border border-slate-800/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500"
            onClick={onReset}
          >
            <FiRotateCcw aria-hidden />
            Reset defaults
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-300"
            onClick={onApply}
            aria-label="Apply filters"
          >
            <FiCheck aria-hidden />
          </button>
        </div>
      </div>
    </Modal>
  );
}
