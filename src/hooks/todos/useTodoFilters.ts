"use client";

import { useMemo, useState } from "react";

import type { FilterDraft } from "@/components/todos/FiltersModal";
import { formatGroupTitle } from "@/lib/todoFormatters";
import type { Todo, TodoPriority } from "@/lib/types";

const defaultFilters: FilterDraft = {
  status: "pending",
  priority: "all",
  sortBy: "scheduled",
  sortOrder: "asc",
  datePreset: "all",
  selectedDate: ""
};

export const useTodoFilters = (todos: Todo[]) => {
  const activeTodos = useMemo(() => todos.filter((todo) => !todo.archivedAt), [todos]);
  const [statusFilter, setStatusFilter] = useState<"all" | Todo["status"]>(
    defaultFilters.status
  );
  const [priorityFilter, setPriorityFilter] = useState<"all" | TodoPriority>(
    defaultFilters.priority
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultFilters.sortOrder);
  const [sortBy, setSortBy] = useState<FilterDraft["sortBy"]>(defaultFilters.sortBy);
  const [datePreset, setDatePreset] = useState<FilterDraft["datePreset"]>(
    defaultFilters.datePreset
  );
  const [selectedDate, setSelectedDate] = useState(defaultFilters.selectedDate);
  const [filterDraft, setFilterDraft] = useState<FilterDraft>(defaultFilters);
  const [contextTagFilter, setContextTagFilter] = useState("all");
  const uncategorizedLabel = "Uncategorized";
  const hasUncategorized = useMemo(
    () => activeTodos.some((todo) => !(todo.contextTags ?? []).length),
    [activeTodos]
  );

  const contextTagOptions = useMemo(() => {
    const tags = new Set<string>();
    activeTodos.forEach((todo) => {
      (todo.contextTags ?? []).forEach((tag) => tags.add(tag));
    });
    const options = Array.from(tags).sort();
    if (hasUncategorized) {
      options.unshift(uncategorizedLabel);
    }
    return options;
  }, [activeTodos, hasUncategorized, uncategorizedLabel]);

  const handleApplyFilters = () => {
    setStatusFilter(filterDraft.status);
    setPriorityFilter(filterDraft.priority);
    const nextSortBy =
      filterDraft.status === "completed"
        ? filterDraft.sortBy
        : filterDraft.sortBy === "completed"
        ? "scheduled"
        : filterDraft.sortBy;
    setSortBy(nextSortBy);
    setSortOrder(filterDraft.sortOrder);
    setDatePreset(filterDraft.datePreset);
    setSelectedDate(filterDraft.selectedDate);
  };

  const handleResetFilters = () => {
    setFilterDraft(defaultFilters);
    setStatusFilter(defaultFilters.status);
    setPriorityFilter(defaultFilters.priority);
    setSortBy(defaultFilters.sortBy);
    setSortOrder(defaultFilters.sortOrder);
    setDatePreset(defaultFilters.datePreset);
    setSelectedDate(defaultFilters.selectedDate);
  };

  const handleQuickFilter = (value: "all" | "today" | "completed" | "flagged") => {
    switch (value) {
      case "today":
        setStatusFilter("pending");
        setPriorityFilter("all");
        setDatePreset("today");
        if (sortBy === "completed") {
          setSortBy("scheduled");
        }
        break;
      case "completed":
        setStatusFilter("completed");
        setPriorityFilter("all");
        setDatePreset("all");
        break;
      case "flagged":
        setStatusFilter("all");
        setPriorityFilter("high");
        setDatePreset("all");
        if (sortBy === "completed") {
          setSortBy("scheduled");
        }
        break;
      case "all":
      default:
        setStatusFilter("all");
        setPriorityFilter("all");
        setDatePreset("all");
        if (sortBy === "completed") {
          setSortBy("scheduled");
        }
        break;
    }
  };

  const todayStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);
    const todaysTodos = activeTodos.filter((todo) => {
      const scheduled = todo.scheduledDate?.toDate();
      return scheduled && scheduled >= todayStart && scheduled <= todayEnd;
    });
    const visibleTodos = todaysTodos.filter((todo) => todo.status !== "skipped");
    const completed = visibleTodos.filter((todo) => todo.status === "completed").length;
    return {
      total: visibleTodos.length,
      completed,
      percent: visibleTodos.length ? Math.round((completed / visibleTodos.length) * 100) : 0
    };
  }, [activeTodos]);

  const streakCount = useMemo(() => {
    const completedDates = new Set<string>();
    activeTodos.forEach((todo) => {
      if (todo.status !== "completed" || !todo.completedDate) return;
      const date = todo.completedDate.toDate();
      completedDates.add(date.toISOString().split("T")[0]);
    });
    let streak = 0;
    const cursor = new Date();
    for (let i = 0; i < 30; i += 1) {
      const key = cursor.toISOString().split("T")[0];
      if (!completedDates.has(key)) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }, [activeTodos]);

  const groupedTodos = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);
    const weekEnd = new Date(todayStart);
    weekEnd.setDate(todayStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const matchesDatePreset = (todo: Todo) => {
      if (!todo.scheduledDate) {
        return datePreset === "all";
      }
      const scheduled = todo.scheduledDate.toDate();
      switch (datePreset) {
        case "today":
          return scheduled >= todayStart && scheduled <= todayEnd;
        case "tomorrow":
          return scheduled >= tomorrowStart && scheduled <= tomorrowEnd;
        case "week":
          return scheduled >= todayStart && scheduled <= weekEnd;
        case "spillover":
          return scheduled < todayStart;
        case "upcoming":
          return scheduled > todayEnd;
        case "custom": {
          if (!selectedDate) return true;
          const selected = new Date(`${selectedDate}T00:00:00`);
          const selectedEnd = new Date(selected);
          selectedEnd.setHours(23, 59, 59, 999);
          return scheduled >= selected && scheduled <= selectedEnd;
        }
        case "all":
        default:
          return true;
      }
    };

    const filteredTodos = activeTodos.filter((todo) => {
      const matchesStatus = statusFilter === "all" || todo.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || todo.priority === priorityFilter;
      const matchesDate = matchesDatePreset(todo);
      const matchesContextTag =
        contextTagFilter === "all" ||
        (contextTagFilter === uncategorizedLabel
          ? !(todo.contextTags ?? []).length
          : (todo.contextTags ?? []).includes(contextTagFilter));
      return matchesStatus && matchesPriority && matchesDate && matchesContextTag;
    });

    if (filteredTodos.length === 0) return [];

    const groups = new Map<
      string,
      { title: string; items: Todo[]; sortKey: number; sectionRank: number }
    >();
    const unscheduled: Todo[] = [];
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    filteredTodos.forEach((todo) => {
      const activeDate =
        sortBy === "completed"
          ? todo.completedDate?.toDate()
          : todo.scheduledDate?.toDate();
      if (!activeDate) {
        unscheduled.push(todo);
        return;
      }

      let sectionRank = 2;
      let dateKey = formatGroupTitle(activeDate);
      if (activeDate >= todayStart && activeDate <= todayEnd) {
        sectionRank = 0;
        dateKey = "Today";
      } else if (activeDate >= tomorrowStart && activeDate <= tomorrowEnd) {
        sectionRank = 1;
        dateKey = "Tomorrow";
      } else if (activeDate > tomorrowEnd) {
        sectionRank = 2;
        dateKey = `Later · ${formatGroupTitle(activeDate)}`;
      } else if (activeDate < todayStart) {
        sectionRank = 3;
      }
      const midnight = new Date(
        activeDate.getFullYear(),
        activeDate.getMonth(),
        activeDate.getDate()
      ).getTime();
      const existing = groups.get(dateKey);
      if (existing) {
        existing.items.push(todo);
      } else {
        groups.set(dateKey, {
          title: dateKey,
          items: [todo],
          sortKey: midnight,
          sectionRank
        });
      }
    });

    const orderedGroups = Array.from(groups.values())
      .sort((a, b) => {
        if (a.sectionRank !== b.sectionRank) {
          return a.sectionRank - b.sectionRank;
        }
        if (a.sectionRank === 0 && b.sectionRank === 0) return 0;
        return (a.sortKey - b.sortKey) * sortDirection;
      })
      .map((group) => ({
        title: group.title,
        items: group.items.sort((a, b) => {
          if (sortBy === "priority") {
            const priorityOrder = { low: 3, medium: 2, high: 1 };
            return (priorityOrder[a.priority] - priorityOrder[b.priority]) * sortDirection;
          }
          if (sortBy === "created") {
            const aMillis = a.createdAt?.toMillis() ?? 0;
            const bMillis = b.createdAt?.toMillis() ?? 0;
            return (aMillis - bMillis) * sortDirection;
          }
          if (sortBy === "manual") {
            return 0;
          }
          const aMillis =
            sortBy === "completed" ? a.completedDate?.toMillis() : a.scheduledDate?.toMillis();
          const bMillis =
            sortBy === "completed" ? b.completedDate?.toMillis() : b.scheduledDate?.toMillis();
          if (!aMillis || !bMillis) return 0;
          return (aMillis - bMillis) * sortDirection;
        })
      }));

    if (unscheduled.length) {
      unscheduled.sort((a, b) => a.title.localeCompare(b.title));
      orderedGroups.push({
        title: sortBy === "completed" ? "No completion date" : "Unscheduled",
        items: unscheduled
      });
    }

    return orderedGroups;
  }, [
    activeTodos,
    statusFilter,
    priorityFilter,
    sortBy,
    sortOrder,
    datePreset,
    selectedDate,
    contextTagFilter
  ]);

  const emptyStateLabel = useMemo(() => {
    if (datePreset === "today") return "Nothing due today.";
    if (statusFilter === "completed") return "No completed tasks yet.";
    if (statusFilter === "skipped") return "No skipped tasks yet.";
    if (priorityFilter === "high") return "No flagged tasks right now.";
    return "No todos yet. Add one with the + button.";
  }, [datePreset, statusFilter, priorityFilter]);

  return {
    statusFilter,
    priorityFilter,
    sortOrder,
    sortBy,
    datePreset,
    selectedDate,
    filterDraft,
    contextTagFilter,
    contextTagOptions,
    groupedTodos,
    todayStats,
    streakCount,
    emptyStateLabel,
    setSortBy,
    setSortOrder,
    setFilterDraft,
    setContextTagFilter,
    handleApplyFilters,
    handleResetFilters,
    handleQuickFilter
  };
};
