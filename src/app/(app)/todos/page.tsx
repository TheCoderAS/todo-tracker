"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc
} from "firebase/firestore";

import FiltersModal, { type FilterDraft } from "@/components/todos/FiltersModal";
import TodoForm from "@/components/todos/TodoForm";
import TodoSection from "@/components/todos/TodoSection";
import HabitForm from "@/components/habits/HabitForm";
import HabitSection from "@/components/habits/HabitSection";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import OverlayLoader from "@/components/ui/OverlayLoader";
import Snackbar, { type SnackbarVariant } from "@/components/ui/Snackbar";
import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/firebase";
import { getDateKey, getLocalTimeZone } from "@/lib/habitUtils";
import {
  formatDateDisplay,
  formatDateInput,
  formatGroupTitle,
  formatTimeInput
} from "@/lib/todoFormatters";
import type { Habit, HabitInput, Todo, TodoInput, TodoPriority } from "@/lib/types";

const priorities: TodoPriority[] = ["low", "medium", "high"];

const defaultForm: TodoInput = {
  title: "",
  scheduledDate: "",
  scheduledTime: "",
  priority: "medium",
  tags: "",
  description: ""
};

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTimeValue = (date: Date) => {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
};

const getDefaultSchedule = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const remainder = minutes % 30;
  const addMinutes = remainder === 0 ? 30 : 30 - remainder;
  const slot = new Date(now.getTime() + addMinutes * 60000);
  return {
    scheduledDate: formatDateValue(slot),
    scheduledTime: formatTimeValue(slot)
  };
};

export default function TodosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [form, setForm] = useState<TodoInput>(defaultForm);
  const [habitForm, setHabitForm] = useState<HabitInput>({
    title: "",
    reminderTime: "",
    reminderDays: [0, 1, 2, 3, 4, 5, 6],
    frequency: "daily"
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [titleHasError, setTitleHasError] = useState(false);
  const [scheduleHasError, setScheduleHasError] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    variant: SnackbarVariant;
  } | null>(null);
  const defaultFilters: FilterDraft = {
    status: "pending",
    priority: "all",
    sortBy: "scheduled",
    sortOrder: "asc",
    datePreset: "all",
    selectedDate: ""
  };
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isHabitInitialLoad, setIsHabitInitialLoad] = useState(true);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"todos" | "habits">(() =>
    searchParams.get("tab") === "habits" ? "habits" : "todos"
  );

  useEffect(() => {
    if (!user) {
      setTodos([]);
      setIsInitialLoad(false);
      return;
    }

    setIsInitialLoad(true);
    const todosQuery = query(
      collection(db, "users", user.uid, "todos"),
      orderBy("createdAt", "desc")
    );

    let isFirstSnapshot = true;
    const unsubscribe = onSnapshot(todosQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<Todo, "id">)
      }));
      setTodos(data);
      if (isFirstSnapshot) {
        setIsInitialLoad(false);
        isFirstSnapshot = false;
      }
    });

    return () => unsubscribe();
  }, [pathname, user]);

  useEffect(() => {
    if (!user) {
      setHabits([]);
      setIsHabitInitialLoad(false);
      return;
    }

    setIsHabitInitialLoad(true);
    const habitsQuery = query(
      collection(db, "users", user.uid, "habits"),
      orderBy("createdAt", "desc")
    );

    let isFirstSnapshot = true;
    const unsubscribe = onSnapshot(habitsQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<Habit, "id">)
      }));
      setHabits(data);
      if (isFirstSnapshot) {
        setIsHabitInitialLoad(false);
        isFirstSnapshot = false;
      }
    });

    return () => unsubscribe();
  }, [pathname, user]);

  useEffect(() => {
    const nextTab = searchParams.get("tab") === "habits" ? "habits" : "todos";
    setActiveTab((prev) => (prev === nextTab ? prev : nextTab));
  }, [searchParams]);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    let nextValue = value;
    if (name === "tags") {
      nextValue = value.toLowerCase();
    }
    if (name === "title") {
      nextValue = value.slice(0, 24);
      if (nextValue.trim() && nextValue.trim().length <= 24) {
        setTitleHasError(false);
      }
    }
    setForm((prev) => {
      const nextForm = { ...prev, [name]: nextValue };
      if (name === "scheduledDate" || name === "scheduledTime") {
        const hasScheduledDate = Boolean(nextForm.scheduledDate.trim());
        const hasScheduledTime = Boolean(nextForm.scheduledTime.trim());
        if (hasScheduledDate && hasScheduledTime) {
          setScheduleHasError(false);
        }
      }
      return nextForm;
    });
  };

  const handleDescriptionChange = (value: string) => {
    setForm((prev) => ({ ...prev, description: value }));
  };

  const resetForm = () => {
    setForm({ ...defaultForm, ...getDefaultSchedule() });
    setEditingId(null);
    setTitleHasError(false);
    setScheduleHasError(false);
  };

  const resetHabitForm = () => {
    const now = new Date();
    setHabitForm({
      title: "",
      reminderTime: formatTimeValue(now),
      reminderDays: [0, 1, 2, 3, 4, 5, 6],
      frequency: "daily"
    });
  };

  const setTab = (tab: "todos" | "habits") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "habits") {
      params.set("tab", "habits");
    } else {
      params.delete("tab");
    }
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false
    });
  };

  const openCreateModal = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openHabitModal = () => {
    resetHabitForm();
    setTab("habits");
    setIsHabitFormOpen(true);
  };

  const openFilterModal = () => {
    setFilterDraft({
      status: statusFilter,
      priority: priorityFilter,
      sortBy,
      sortOrder,
      datePreset,
      selectedDate
    });
    setIsFilterOpen(true);
  };

  const closeFormModal = () => {
    resetForm();
    setIsFormOpen(false);
  };

  const closeHabitModal = () => {
    resetHabitForm();
    setIsHabitFormOpen(false);
  };

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
    setIsFilterOpen(false);
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

  const handleEditTodo = (todo: Todo) => {
    setEditingId(todo.id);
    setForm({
      title: todo.title,
      scheduledDate: todo.scheduledDate ? formatDateInput(todo.scheduledDate) : "",
      scheduledTime: todo.scheduledDate ? formatTimeInput(todo.scheduledDate) : "",
      priority: todo.priority,
      tags: todo.tags.join(", "),
      description: todo.description ?? ""
    });
    setIsFormOpen(true);
  };

  const handleDeleteRequest = (todoId: string) => {
    setConfirmDeleteId(todoId);
  };

  const handleDeleteTodo = async (todoId: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "users", user.uid, "todos", todoId));
      setSnackbar({ message: "Todo deleted.", variant: "info" });
      if (selectedTodo?.id === todoId) {
        setSelectedTodo(null);
      }
    } catch (error) {
      setSnackbar({ message: "Unable to delete todo.", variant: "error" });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (todo: Todo) => {
    if (!user) return;
    setActionLoading(true);
    try {
      const todoRef = doc(db, "users", user.uid, "todos", todo.id);
      const nextStatus = todo.status === "completed" ? "pending" : "completed";
      await updateDoc(todoRef, {
        status: nextStatus,
        completedDate: nextStatus === "completed" ? serverTimestamp() : null
      });
      if (selectedTodo?.id === todo.id) {
        setSelectedTodo({
          ...selectedTodo,
          status: nextStatus,
          completedDate: nextStatus === "completed" ? Timestamp.now() : null
        });
      }
      if (nextStatus === "completed") {
        setLastCompletedId(todo.id);
        window.setTimeout(() => setLastCompletedId(null), 1200);
      }
      setSnackbar({
        message:
          nextStatus === "completed"
            ? "Todo marked as completed."
            : "Todo moved back to pending.",
        variant: "success"
      });
    } catch (error) {
      setSnackbar({ message: "Unable to update todo status.", variant: "error" });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFlag = async (todo: Todo) => {
    if (!user) return;
    setActionLoading(true);
    try {
      const todoRef = doc(db, "users", user.uid, "todos", todo.id);
      const nextPriority = todo.priority === "high" ? "medium" : "high";
      await updateDoc(todoRef, {
        priority: nextPriority,
        updatedAt: serverTimestamp()
      });
      setSnackbar({
        message:
          nextPriority === "high" ? "Flagged for priority focus." : "Flag removed.",
        variant: "success"
      });
    } catch (error) {
      setSnackbar({ message: "Unable to update priority flag.", variant: "error" });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitTodo = async (event: React.FormEvent) => {
    event.preventDefault();
    setActionLoading(true);

    if (!user) {
      setSnackbar({ message: "Sign in to manage todos.", variant: "error" });
      setActionLoading(false);
      return;
    }

    if (!form.title.trim()) {
      setTitleHasError(true);
      setActionLoading(false);
      return;
    }

    const hasScheduledDate = Boolean(form.scheduledDate);
    const hasScheduledTime = Boolean(form.scheduledTime);

    if (!hasScheduledDate || !hasScheduledTime) {
      setScheduleHasError(true);
      setActionLoading(false);
      return;
    }

    const scheduledDate = Timestamp.fromDate(
      new Date(`${form.scheduledDate}T${form.scheduledTime}`)
    );

    try {
      if (editingId) {
        const todoRef = doc(db, "users", user.uid, "todos", editingId);
        const existing = todos.find((todo) => todo.id === editingId);
        await updateDoc(todoRef, {
          title: form.title.trim(),
          scheduledDate,
          priority: form.priority,
          tags: form.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          description: form.description,
          status: "pending",
          completedDate: null,
          author_uid: user.uid,
          updatedAt: serverTimestamp()
        });
        setSnackbar({
          message: existing
            ? "Todo updated successfully."
            : "Todo saved successfully.",
          variant: "success"
        });
      } else {
        await addDoc(collection(db, "users", user.uid, "todos"), {
          title: form.title.trim(),
          scheduledDate,
          createdAt: serverTimestamp(),
          priority: form.priority,
          status: "pending",
          completedDate: null,
          author_uid: user.uid,
          tags: form.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          description: form.description
        });
        setSnackbar({ message: "Todo added to your list.", variant: "success" });
      }

      closeFormModal();
    } catch (error) {
      setSnackbar({ message: "Unable to save todo.", variant: "error" });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleHabitFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setHabitForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleHabitDayToggle = (dayIndex: number) => {
    setHabitForm((prev) => {
      const hasDay = prev.reminderDays.includes(dayIndex);
      const nextDays = hasDay
        ? prev.reminderDays.filter((day) => day !== dayIndex)
        : [...prev.reminderDays, dayIndex];
      return {
        ...prev,
        reminderDays: nextDays.length ? nextDays : prev.reminderDays
      };
    });
  };

  const handleSubmitHabit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!habitForm.title.trim()) {
      setSnackbar({ message: "Add a habit title to continue.", variant: "error" });
      return;
    }
    if (!habitForm.reminderTime.trim()) {
      setSnackbar({ message: "Choose a reminder time.", variant: "error" });
      return;
    }
    if (!user) {
      setSnackbar({ message: "Sign in to manage habits.", variant: "error" });
      return;
    }
    setActionLoading(true);
    try {
      await addDoc(collection(db, "users", user.uid, "habits"), {
        title: habitForm.title.trim(),
        reminderTime: habitForm.reminderTime,
        reminderDays: habitForm.reminderDays,
        frequency: habitForm.frequency,
        completionDates: [],
        timezone: getLocalTimeZone(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastNotifiedDate: null
      });
      setSnackbar({ message: "Habit added to your list.", variant: "success" });
      closeHabitModal();
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to save habit.", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleHabitCompletion = async (habit: Habit) => {
    if (!user) {
      setSnackbar({ message: "Sign in to update habits.", variant: "error" });
      return;
    }
    const todayKey = getDateKey(new Date(), habit.timezone);
    const completionDates = habit.completionDates ?? [];
    const isCompleted = completionDates.includes(todayKey);
    const nextDates = isCompleted
      ? completionDates.filter((date) => date !== todayKey)
      : [...completionDates, todayKey];
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid, "habits", habit.id), {
        completionDates: nextDates,
        updatedAt: serverTimestamp()
      });
      setSnackbar({
        message: isCompleted ? "Habit reset for today." : "Nice work! Habit completed.",
        variant: "success"
      });
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to update habit.", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const todayStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);
    const todaysTodos = todos.filter((todo) => {
      const scheduled = todo.scheduledDate?.toDate();
      return scheduled && scheduled >= todayStart && scheduled <= todayEnd;
    });
    const completed = todaysTodos.filter((todo) => todo.status === "completed").length;
    return {
      total: todaysTodos.length,
      completed,
      percent: todaysTodos.length ? Math.round((completed / todaysTodos.length) * 100) : 0
    };
  }, [todos]);

  const streakCount = useMemo(() => {
    const completedDates = new Set<string>();
    todos.forEach((todo) => {
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
  }, [todos]);

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

    const filteredTodos = todos.filter((todo) => {
      const matchesStatus = statusFilter === "all" || todo.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || todo.priority === priorityFilter;
      const matchesDate = matchesDatePreset(todo);
      return matchesStatus && matchesPriority && matchesDate;
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
            sortBy === "completed"
              ? a.completedDate?.toMillis()
              : a.scheduledDate?.toMillis();
          const bMillis =
            sortBy === "completed"
              ? b.completedDate?.toMillis()
              : b.scheduledDate?.toMillis();
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
  }, [todos, statusFilter, priorityFilter, sortBy, sortOrder, datePreset, selectedDate]);

  const emptyStateLabel = useMemo(() => {
    if (datePreset === "today") return "Nothing due today.";
    if (statusFilter === "completed") return "No completed tasks yet.";
    if (priorityFilter === "high") return "No flagged tasks right now.";
    return "No todos yet. Add one with the + button.";
  }, [datePreset, statusFilter, priorityFilter]);

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

  const isLoading = loading || isInitialLoad;
  const isHabitLoading = loading || isHabitInitialLoad;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex w-full rounded-full border border-slate-800/70 bg-slate-900/60 p-1 text-xs font-semibold">
        <button
          type="button"
          className={`flex-1 rounded-full px-4 py-2 text-center transition sm:flex-none ${
            activeTab === "todos" ? "bg-sky-500/20 text-sky-200" : "text-slate-400"
          }`}
          onClick={() => setTab("todos")}
        >
          Todos
        </button>
        <button
          type="button"
          className={`flex-1 rounded-full px-4 py-2 text-center transition sm:flex-none ${
            activeTab === "habits" ? "bg-sky-500/20 text-sky-200" : "text-slate-400"
          }`}
          onClick={() => setTab("habits")}
        >
          Habits
        </button>
      </div>

      {activeTab === "todos" ? (
        <>
          <TodoSection
            groups={groupedTodos}
            formatDate={formatDateDisplay}
            onEdit={handleEditTodo}
            onToggleStatus={handleToggleStatus}
            onToggleFlag={handleToggleFlag}
            onDelete={handleDeleteRequest}
            selectedTodo={selectedTodo}
            onSelectTodo={setSelectedTodo}
            onOpenFilter={openFilterModal}
            onOpenCreate={openCreateModal}
            onOpenHabit={openHabitModal}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            datePreset={datePreset}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onQuickFilter={handleQuickFilter}
            onSortByChange={setSortBy}
            onSortOrderChange={setSortOrder}
            emptyStateLabel={emptyStateLabel}
            todayStats={todayStats}
            streakCount={streakCount}
            lastCompletedId={lastCompletedId}
            isLoading={isLoading}
          />
          <Modal isOpen={isFormOpen} onClose={closeFormModal} ariaLabel="Todo form">
            <TodoForm
              form={form}
              priorities={priorities}
              isEditing={isEditing}
              titleHasError={titleHasError}
              scheduleHasError={scheduleHasError}
              onChange={handleFormChange}
              onDescriptionChange={handleDescriptionChange}
              onSubmit={handleSubmitTodo}
              onCancelEdit={closeFormModal}
            />
          </Modal>
          <FiltersModal
            isOpen={isFilterOpen}
            filterDraft={filterDraft}
            onClose={() => setIsFilterOpen(false)}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            onDraftChange={setFilterDraft}
          />
          <ConfirmDialog
            isOpen={Boolean(confirmDeleteId)}
            title="Delete this todo?"
            description="This action cannot be undone."
            confirmLabel="Delete todo"
            cancelLabel="Cancel"
            isLoading={actionLoading}
            onConfirm={() => {
              if (confirmDeleteId) {
                handleDeleteTodo(confirmDeleteId);
              }
              setConfirmDeleteId(null);
            }}
            onCancel={() => setConfirmDeleteId(null)}
          />
        </>
      ) : (
        <>
          <HabitSection
            habits={habits}
            onToggleComplete={handleToggleHabitCompletion}
            onOpenCreate={openHabitModal}
            isLoading={isHabitLoading}
          />
          <Modal
            isOpen={isHabitFormOpen}
            onClose={closeHabitModal}
            ariaLabel="Habit form"
          >
            <HabitForm
              form={habitForm}
              onChange={handleHabitFormChange}
              onToggleDay={handleHabitDayToggle}
              onSubmit={handleSubmitHabit}
              onCancel={closeHabitModal}
            />
          </Modal>
        </>
      )}
      {actionLoading ? <OverlayLoader /> : null}
      {snackbar ? (
        <Snackbar
          message={snackbar.message}
          variant={snackbar.variant}
          onDismiss={() => setSnackbar(null)}
        />
      ) : null}
    </section>
  );
}
