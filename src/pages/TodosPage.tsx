import { useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc
} from "firebase/firestore";

import FiltersModal from "@/components/todos/FiltersModal";
import TodoForm from "@/components/todos/TodoForm";
import TodoSection from "@/components/todos/TodoSection";
import HabitForm from "@/components/habits/HabitForm";
import HabitDetailsModal from "@/components/habits/HabitDetailsModal";
import HabitSection from "@/components/habits/HabitSection";
import RoutineForm from "@/components/routines/RoutineForm";
import RoutineSection from "@/components/routines/RoutineSection";
import FocusBlockPanel from "@/components/focus/FocusBlockPanel";
import ReviewPanel, { type MissedHabitEntry } from "@/components/review/ReviewPanel";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import OverlayLoader from "@/components/ui/OverlayLoader";
import Snackbar, { type SnackbarVariant } from "@/components/ui/Snackbar";
import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/firebase";
import {
  getDateKey,
  getHabitMilestoneProgress,
  getLocalTimeZone,
  isHabitScheduledForDate
} from "@/lib/habitUtils";
import {
  formatDateDisplay,
  formatDateInput,
  formatTimeInput
} from "@/lib/todoFormatters";
import type {
  Habit,
  HabitFrequency,
  HabitInput,
  Routine,
  RoutineInput,
  RoutineItemInput,
  Todo,
  TodoInput,
  TodoPriority
} from "@/lib/types";
import { useHabitsData } from "@/hooks/todos/useHabitsData";
import { useRoutinesData } from "@/hooks/todos/useRoutinesData";
import { useTabState } from "@/hooks/todos/useTabState";
import { useTodoFilters } from "@/hooks/todos/useTodoFilters";
import { useTodosData } from "@/hooks/todos/useTodosData";
import { useFocusBlocksData } from "@/hooks/focus/useFocusBlocksData";

const priorities: TodoPriority[] = ["low", "medium", "high"];

const defaultForm: TodoInput = {
  title: "",
  scheduledDate: "",
  scheduledTime: "",
  priority: "medium",
  tags: "",
  contextTags: [],
  description: ""
};

const createEmptyRoutineItem = (): RoutineItemInput => ({
  title: "",
  priority: "medium",
  tags: "",
  contextTags: "",
  description: ""
});

const defaultRoutineForm: RoutineInput = {
  title: "",
  items: [createEmptyRoutineItem()]
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

const normalizeTitle = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
};

const getDefaultReminderDays = (frequency: HabitFrequency) => {
  const today = new Date();
  if (frequency === "weekly") {
    return [today.getDay()];
  }
  if (frequency === "daily") {
    return [0, 1, 2, 3, 4, 5, 6];
  }
  if (frequency === "yearly") {
    return [today.getMonth() + 1, today.getDate()];
  }
  return [today.getDate()];
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
  const { todos, isInitialLoad } = useTodosData(user);
  const { habits, isInitialLoad: isHabitInitialLoad } = useHabitsData(user);
  const { routines, isInitialLoad: isRoutineInitialLoad } = useRoutinesData(user);
  const { activeBlock, isInitialLoad: isFocusInitialLoad } = useFocusBlocksData(user);
  const { activeTab, setTab } = useTabState();
  const [form, setForm] = useState<TodoInput>(defaultForm);
  const [routineForm, setRoutineForm] = useState<RoutineInput>(defaultRoutineForm);
  const [habitForm, setHabitForm] = useState<HabitInput>({
    title: "",
    habitType: "positive",
    reminderTime: "",
    reminderDays: getDefaultReminderDays("daily"),
    frequency: "daily",
    graceMisses: 0,
    contextTags: [],
    triggerAfterHabitId: null
  });
  const [graceMissesInput, setGraceMissesInput] = useState("0");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);
  const [isRoutineFormOpen, setIsRoutineFormOpen] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [titleHasError, setTitleHasError] = useState(false);
  const [scheduleHasError, setScheduleHasError] = useState(false);
  const [confirmHabitDelete, setConfirmHabitDelete] = useState<Habit | null>(null);
  const [confirmRoutineDelete, setConfirmRoutineDelete] = useState<Routine | null>(null);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    variant: SnackbarVariant;
  } | null>(null);
  const {
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
  } = useTodoFilters(todos);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [linkedHabitPrompt, setLinkedHabitPrompt] = useState<{
    source: Habit;
    target: Habit;
  } | null>(null);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);
  const overdueTodos = useMemo(() => {
    const now = new Date();
    return todos
      .filter(
        (todo) =>
          !todo.archivedAt &&
          todo.status === "pending" &&
          todo.scheduledDate &&
          todo.scheduledDate.toDate() < now
      )
      .sort(
        (a, b) =>
          (a.scheduledDate?.toMillis() ?? 0) - (b.scheduledDate?.toMillis() ?? 0)
      );
  }, [todos]);

  const reviewWindowDays = 7;

  const missedHabits = useMemo<MissedHabitEntry[]>(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dates = Array.from({ length: reviewWindowDays }).map((_, index) => {
      const date = new Date(startOfToday);
      date.setDate(startOfToday.getDate() - (index + 1));
      return date;
    });
    const entries: MissedHabitEntry[] = [];
    habits
      .filter((habit) => !habit.archivedAt)
      .forEach((habit) => {
        const createdAtDate = habit.createdAt?.toDate?.();
        dates.forEach((date) => {
          if (createdAtDate && date < createdAtDate) return;
          if (!isHabitScheduledForDate(habit, date)) return;
          const dateKey = getDateKey(date, habit.timezone);
          const isCompleted = habit.completionDates?.includes(dateKey);
          const isSkipped = habit.skippedDates?.includes(dateKey);
          if (isCompleted || isSkipped) return;
          entries.push({ habit, date, dateKey });
        });
      });
    return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [habits]);

  const handleFormChange = (
    event:
      | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      | { target: { name: string; value: string[] } }
  ) => {
    const { name, value } = event.target;
    let nextValue: string | number = value;
    if (name === "contextTags" && Array.isArray(value)) {
      setForm((prev) => ({ ...prev, contextTags: value }));
      return;
    }
    if (name === "tags") {
      nextValue = value.toLowerCase();
    }
    if (name === "title") {
      nextValue = value.slice(0, 40);
      if (nextValue.trim() && nextValue.trim().length <= 40) {
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
      habitType: "positive",
      reminderTime: formatTimeValue(now),
      reminderDays: getDefaultReminderDays("daily"),
      frequency: "daily",
      graceMisses: 0,
      contextTags: [],
      triggerAfterHabitId: null
    });
    setGraceMissesInput("0");
    setEditingHabitId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openHabitModal = () => {
    resetHabitForm();
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

  const handleEditTodo = (todo: Todo) => {
    setEditingId(todo.id);
    setForm({
      title: todo.title,
      scheduledDate: todo.scheduledDate ? formatDateInput(todo.scheduledDate) : "",
      scheduledTime: todo.scheduledDate ? formatTimeInput(todo.scheduledDate) : "",
      priority: todo.priority,
      tags: todo.tags.join(", "),
      contextTags: todo.contextTags ?? [],
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
      const nextStatus = todo.status === "pending" ? "completed" : "pending";
      await updateDoc(todoRef, {
        status: nextStatus,
        completedDate: nextStatus === "completed" ? serverTimestamp() : null,
        skippedAt: null,
        updatedAt: serverTimestamp()
      });
      if (selectedTodo?.id === todo.id) {
        setSelectedTodo({
          ...selectedTodo,
          status: nextStatus,
          completedDate: nextStatus === "completed" ? Timestamp.now() : null,
          skippedAt: null
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

  const handleRescheduleTodo = async (todo: Todo) => {
    if (!user) {
      setSnackbar({ message: "Sign in to update todos.", variant: "error" });
      return;
    }
    const baseDate = todo.scheduledDate?.toDate() ?? new Date();
    const nextDate = new Date(baseDate);
    nextDate.setDate(baseDate.getDate() + 1);
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid, "todos", todo.id), {
        scheduledDate: Timestamp.fromDate(nextDate),
        status: "pending",
        completedDate: null,
        skippedAt: null,
        updatedAt: serverTimestamp()
      });
      setSnackbar({ message: "Todo rescheduled for tomorrow.", variant: "success" });
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to reschedule todo.", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkipTodo = async (todo: Todo) => {
    if (!user) {
      setSnackbar({ message: "Sign in to update todos.", variant: "error" });
      return;
    }
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid, "todos", todo.id), {
        status: "skipped",
        completedDate: null,
        skippedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSnackbar({ message: "Todo marked as skipped.", variant: "info" });
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to skip todo.", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveTodo = async (todo: Todo) => {
    if (!user) {
      setSnackbar({ message: "Sign in to update todos.", variant: "error" });
      return;
    }
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid, "todos", todo.id), {
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSnackbar({ message: "Todo archived.", variant: "info" });
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to archive todo.", variant: "error" });
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

    const normalizedTitle = normalizeTitle(form.title);
    if (!normalizedTitle) {
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
          title: normalizedTitle,
          scheduledDate,
          priority: form.priority,
          tags: form.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          contextTags: form.contextTags,
          description: form.description,
          status: "pending",
          completedDate: null,
          skippedAt: null,
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
          title: normalizedTitle,
          scheduledDate,
          createdAt: serverTimestamp(),
          priority: form.priority,
          status: "pending",
          completedDate: null,
          skippedAt: null,
          author_uid: user.uid,
          tags: form.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          contextTags: form.contextTags,
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

  const handleHabitFormChange = (
    event:
      | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      | { target: { name: string; value: string[] } }
  ) => {
    const { name, value } = event.target;
    let nextValue = value;
    if (name === "contextTags" && Array.isArray(value)) {
      setHabitForm((prev) => ({ ...prev, contextTags: value }));
      return;
    }
    if (name === "triggerAfterHabitId") {
      setHabitForm((prev) => ({
        ...prev,
        triggerAfterHabitId: value ? value : null
      }));
      return;
    }
    if (name === "frequency") {
      const nextFrequency = value as HabitFrequency;
      setHabitForm((prev) => ({
        ...prev,
        frequency: nextFrequency,
        reminderDays: getDefaultReminderDays(nextFrequency)
      }));
      return;
    }
    if (name === "title") {
      nextValue = value.slice(0, 40);
    }
    setHabitForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleGraceMissesChange = (value: string) => {
    setGraceMissesInput(value);
    if (!value.trim()) return;
    const nextNumber = Number.parseInt(value, 10);
    if (Number.isNaN(nextNumber)) return;
    setHabitForm((prev) => ({
      ...prev,
      graceMisses: Math.min(7, Math.max(0, nextNumber))
    }));
  };

  const handleGraceMissesBlur = () => {
    if (!graceMissesInput.trim()) {
      setGraceMissesInput("0");
      setHabitForm((prev) => ({ ...prev, graceMisses: 0 }));
      return;
    }
    const nextNumber = Number.parseInt(graceMissesInput, 10);
    const normalized = Number.isNaN(nextNumber)
      ? 0
      : Math.min(7, Math.max(0, nextNumber));
    setGraceMissesInput(String(normalized));
    setHabitForm((prev) => ({ ...prev, graceMisses: normalized }));
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

  const handleHabitDayOfMonthChange = (dayOfMonth: number) => {
    setHabitForm((prev) => ({
      ...prev,
      reminderDays:
        prev.frequency === "yearly"
          ? [
              prev.reminderDays.length >= 2
                ? prev.reminderDays[0]
                : new Date().getMonth() + 1,
              dayOfMonth
            ]
          : [dayOfMonth]
    }));
  };

  const handleHabitMonthChange = (month: number) => {
    setHabitForm((prev) => ({
      ...prev,
      reminderDays: [
        month,
        prev.reminderDays[1] ??
          prev.reminderDays[0] ??
          new Date().getDate()
      ]
    }));
  };

  const handleSubmitHabit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedHabitTitle = normalizeTitle(habitForm.title);
    if (!normalizedHabitTitle) {
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
      if (editingHabitId) {
        await updateDoc(doc(db, "users", user.uid, "habits", editingHabitId), {
          title: normalizedHabitTitle,
          habitType: habitForm.habitType,
          reminderTime: habitForm.reminderTime,
          reminderDays: habitForm.reminderDays,
          frequency: habitForm.frequency,
          graceMisses: habitForm.graceMisses,
          contextTags: habitForm.contextTags,
          triggerAfterHabitId: habitForm.triggerAfterHabitId ?? null,
          updatedAt: serverTimestamp()
        });
        setSnackbar({ message: "Habit updated.", variant: "success" });
      } else {
        await addDoc(collection(db, "users", user.uid, "habits"), {
          title: normalizedHabitTitle,
          habitType: habitForm.habitType,
          reminderTime: habitForm.reminderTime,
          reminderDays: habitForm.reminderDays,
          frequency: habitForm.frequency,
          graceMisses: habitForm.graceMisses,
          contextTags: habitForm.contextTags,
          triggerAfterHabitId: habitForm.triggerAfterHabitId ?? null,
          completionDates: [],
          skippedDates: [],
          timezone: getLocalTimeZone(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          author_uid: user.uid,
          lastNotifiedDate: null,
          lastLevelNotified: 0,
          archivedAt: null
        });
        setSnackbar({ message: "Habit added to your list.", variant: "success" });
      }
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
    if (habit.archivedAt) {
      setSnackbar({ message: "Restore the habit to update it.", variant: "error" });
      return;
    }
    const todayKey = getDateKey(new Date(), habit.timezone);
    const completionDates = habit.completionDates ?? [];
    const skippedDates = habit.skippedDates ?? [];
    const isCompleted = completionDates.includes(todayKey);
    const nextDates = isCompleted
      ? completionDates.filter((date) => date !== todayKey)
      : [...completionDates, todayKey];
    const nextSkippedDates = isCompleted
      ? skippedDates
      : skippedDates.filter((date) => date !== todayKey);
    const milestoneProgress = getHabitMilestoneProgress(nextDates.length);
    const lastNotifiedLevel = habit.lastLevelNotified ?? 0;
    const shouldCelebrate = !isCompleted && milestoneProgress.level > lastNotifiedLevel;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid, "habits", habit.id), {
        completionDates: nextDates,
        skippedDates: nextSkippedDates,
        updatedAt: serverTimestamp(),
        ...(shouldCelebrate ? { lastLevelNotified: milestoneProgress.level } : {})
      });
      setSnackbar({
        message: isCompleted
          ? "Habit reset for today."
          : shouldCelebrate
          ? `Level up! You're now level ${milestoneProgress.level}.`
          : "Nice work! Habit completed.",
        variant: "success"
      });
      if (!isCompleted && habit.triggerAfterHabitId) {
        const linkedHabit = habits.find(
          (item) => item.id === habit.triggerAfterHabitId && !item.archivedAt
        );
        if (linkedHabit) {
          setLinkedHabitPrompt({ source: habit, target: linkedHabit });
        }
      }
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to update habit.", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleHabit = async (habit: Habit, dateKey: string) => {
    if (!user) {
      setSnackbar({ message: "Sign in to update habits.", variant: "error" });
      return;
    }
    if (habit.archivedAt) {
      setSnackbar({ message: "Restore the habit to update it.", variant: "error" });
      return;
    }
    const completionDates = habit.completionDates ?? [];
    const skippedDates = habit.skippedDates ?? [];
    const nextCompletionDates = completionDates.includes(dateKey)
      ? completionDates
      : [...completionDates, dateKey];
    const nextSkippedDates = skippedDates.filter((date) => date !== dateKey);
    const milestoneProgress = getHabitMilestoneProgress(nextCompletionDates.length);
    const lastNotifiedLevel = habit.lastLevelNotified ?? 0;
    const shouldCelebrate =
      !completionDates.includes(dateKey) && milestoneProgress.level > lastNotifiedLevel;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid, "habits", habit.id), {
        completionDates: nextCompletionDates,
        skippedDates: nextSkippedDates,
        updatedAt: serverTimestamp(),
        ...(shouldCelebrate ? { lastLevelNotified: milestoneProgress.level } : {})
      });
      setSnackbar({
        message: shouldCelebrate
          ? `Level up! You're now level ${milestoneProgress.level}.`
          : "Habit session marked as rescheduled.",
        variant: "success"
      });
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to reschedule habit session.", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkipHabit = async (habit: Habit, dateKey: string) => {
    if (!user) {
      setSnackbar({ message: "Sign in to update habits.", variant: "error" });
      return;
    }
    if (habit.archivedAt) {
      setSnackbar({ message: "Restore the habit to update it.", variant: "error" });
      return;
    }
    const skippedDates = habit.skippedDates ?? [];
    const completionDates = habit.completionDates ?? [];
    const nextSkippedDates = skippedDates.includes(dateKey)
      ? skippedDates
      : [...skippedDates, dateKey];
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid, "habits", habit.id), {
        completionDates: completionDates.filter((date) => date !== dateKey),
        skippedDates: nextSkippedDates,
        updatedAt: serverTimestamp()
      });
      setSnackbar({ message: "Habit session marked as skipped.", variant: "info" });
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to skip habit session.", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveHabit = async (habit: Habit) => {
    if (!user) {
      setSnackbar({ message: "Sign in to update habits.", variant: "error" });
      return;
    }
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid, "habits", habit.id), {
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSnackbar({ message: "Habit archived.", variant: "info" });
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to archive habit.", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setHabitForm({
      title: habit.title,
      habitType: habit.habitType ?? "positive",
      reminderTime: habit.reminderTime,
      reminderDays: habit.reminderDays?.length
        ? habit.reminderDays
        : getDefaultReminderDays(habit.frequency),
      frequency: habit.frequency,
      graceMisses: habit.graceMisses ?? 0,
      contextTags: habit.contextTags ?? [],
      triggerAfterHabitId: habit.triggerAfterHabitId ?? null
    });
    setGraceMissesInput(String(habit.graceMisses ?? 0));
    setIsHabitFormOpen(true);
  };

  const handleDeleteHabitRequest = (habit: Habit) => {
    setConfirmHabitDelete(habit);
  };

  const handleDeleteHabit = async (habit: Habit) => {
    if (!user) return;
    setActionLoading(true);
    try {
      if (habit.archivedAt) {
        await deleteDoc(doc(db, "users", user.uid, "habits", habit.id));
        setSnackbar({ message: "Habit deleted.", variant: "info" });
      } else {
        await updateDoc(doc(db, "users", user.uid, "habits", habit.id), {
          archivedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setSnackbar({ message: "Habit archived.", variant: "info" });
      }
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to delete habit.", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const openRoutineModal = () => {
    setEditingRoutineId(null);
    setRoutineForm({ title: "", items: [createEmptyRoutineItem()] });
    setIsRoutineFormOpen(true);
  };

  const closeRoutineModal = () => {
    setEditingRoutineId(null);
    setRoutineForm({ title: "", items: [createEmptyRoutineItem()] });
    setIsRoutineFormOpen(false);
  };

  const handleRoutineTitleChange = (value: string) => {
    setRoutineForm((prev) => ({ ...prev, title: value.slice(0, 40) }));
  };

  const handleRoutineItemChange = (
    index: number,
    field: keyof RoutineItemInput,
    value: string
  ) => {
    setRoutineForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleAddRoutineItem = () => {
    setRoutineForm((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyRoutineItem()]
    }));
  };

  const handleRemoveRoutineItem = (index: number) => {
    setRoutineForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutineId(routine.id);
    setRoutineForm({
      title: routine.title,
      items: routine.items.map((item) => ({
        title: item.title,
        priority: item.priority,
        tags: item.tags.join(", "),
        contextTags: item.contextTags.join(", "),
        description: item.description
      }))
    });
    setIsRoutineFormOpen(true);
  };

  const handleDeleteRoutineRequest = (routine: Routine) => {
    setConfirmRoutineDelete(routine);
  };

  const parseTagInput = (value: string) =>
    value
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

  const handleSubmitRoutine = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      setSnackbar({ message: "Sign in to manage routines.", variant: "error" });
      return;
    }

    const normalizedTitle = normalizeTitle(routineForm.title);
    if (!normalizedTitle) {
      setSnackbar({ message: "Add a routine name to continue.", variant: "error" });
      return;
    }

    if (!routineForm.items.length) {
      setSnackbar({
        message: "Add at least one template item to continue.",
        variant: "error"
      });
      return;
    }

    const missingItem = routineForm.items.find((item) => !item.title.trim());
    if (missingItem) {
      setSnackbar({
        message: "Add a title for each routine item.",
        variant: "error"
      });
      return;
    }

    setActionLoading(true);
    try {
      const items = routineForm.items.map((item) => ({
        title: normalizeTitle(item.title),
        priority: item.priority,
        tags: parseTagInput(item.tags),
        contextTags: parseTagInput(item.contextTags),
        description: item.description.trim()
      }));

      if (editingRoutineId) {
        await updateDoc(doc(db, "users", user.uid, "routines", editingRoutineId), {
          title: normalizedTitle,
          items,
          updatedAt: serverTimestamp()
        });
        setSnackbar({ message: "Routine updated.", variant: "success" });
      } else {
        await addDoc(collection(db, "users", user.uid, "routines"), {
          title: normalizedTitle,
          items,
          createdAt: serverTimestamp()
        });
        setSnackbar({ message: "Routine saved.", variant: "success" });
      }
      closeRoutineModal();
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to save routine.", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRoutine = async (routine: Routine) => {
    if (!user) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "users", user.uid, "routines", routine.id));
      setSnackbar({ message: "Routine deleted.", variant: "info" });
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to delete routine.", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunRoutine = async (routine: Routine) => {
    if (!user) {
      setSnackbar({ message: "Sign in to run routines.", variant: "error" });
      return;
    }
    if (!routine.items.length) {
      setSnackbar({ message: "This routine has no template items.", variant: "error" });
      return;
    }

    setActionLoading(true);
    try {
      const { scheduledDate, scheduledTime } = getDefaultSchedule();
      const scheduledDateValue = Timestamp.fromDate(
        new Date(`${scheduledDate}T${scheduledTime}`)
      );
      await Promise.all(
        routine.items.map((item) =>
          addDoc(collection(db, "users", user.uid, "todos"), {
            title: normalizeTitle(item.title),
            scheduledDate: scheduledDateValue,
            createdAt: serverTimestamp(),
            priority: item.priority,
            status: "pending",
            completedDate: null,
            skippedAt: null,
            tags: item.tags,
            contextTags: item.contextTags,
            description: item.description
          })
        )
      );
      setSnackbar({ message: "Routine added to today.", variant: "success" });
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to run routine.", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const isLoading = loading || isInitialLoad;
  const isHabitLoading = loading || isHabitInitialLoad;
  const isRoutineLoading = loading || isRoutineInitialLoad;
  const isFocusLoading = loading || isFocusInitialLoad;

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
        <button
          type="button"
          className={`flex-1 rounded-full px-4 py-2 text-center transition sm:flex-none ${
            activeTab === "focus" ? "bg-sky-500/20 text-sky-200" : "text-slate-400"
          }`}
          onClick={() => setTab("focus")}
        >
          Focus
        </button>
        <button
          type="button"
          className={`flex-1 rounded-full px-4 py-2 text-center transition sm:flex-none ${
            activeTab === "review" ? "bg-sky-500/20 text-sky-200" : "text-slate-400"
          }`}
          onClick={() => setTab("review")}
        >
          Review
        </button>
      </div>

      {activeTab === "todos" ? (
        <div key="todos" className="tab-transition">
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
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            datePreset={datePreset}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onQuickFilter={handleQuickFilter}
            onSortByChange={setSortBy}
            onSortOrderChange={setSortOrder}
            contextTagFilter={contextTagFilter}
            contextTagOptions={contextTagOptions}
            onContextTagChange={setContextTagFilter}
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
            onApply={() => {
              handleApplyFilters();
              setIsFilterOpen(false);
            }}
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
        </div>
      ) : activeTab === "habits" ? (
        <div key="habits" className="tab-transition">
          <HabitSection
            habits={habits}
            onToggleComplete={handleToggleHabitCompletion}
            onOpenCreate={openHabitModal}
            onEdit={handleEditHabit}
            onDelete={handleDeleteHabitRequest}
            onViewDetails={setSelectedHabit}
            isLoading={isHabitLoading}
          />
          <RoutineSection
            routines={routines}
            onOpenCreate={openRoutineModal}
            onEdit={handleEditRoutine}
            onDelete={handleDeleteRoutineRequest}
            onRun={handleRunRoutine}
            isLoading={isRoutineLoading}
          />
          <Modal
            isOpen={isHabitFormOpen}
            onClose={closeHabitModal}
            ariaLabel="Habit form"
          >
            <HabitForm
              form={habitForm}
              graceMissesInput={graceMissesInput}
              habits={habits.filter((habit) => habit.id !== editingHabitId)}
              isEditing={Boolean(editingHabitId)}
              onChange={handleHabitFormChange}
              onGraceMissesChange={handleGraceMissesChange}
              onGraceMissesBlur={handleGraceMissesBlur}
              onToggleDay={handleHabitDayToggle}
              onDayOfMonthChange={handleHabitDayOfMonthChange}
              onMonthChange={handleHabitMonthChange}
              onSubmit={handleSubmitHabit}
              onCancel={closeHabitModal}
            />
          </Modal>
          <Modal
            isOpen={isRoutineFormOpen}
            onClose={closeRoutineModal}
            ariaLabel="Routine form"
          >
            <RoutineForm
              form={routineForm}
              priorities={priorities}
              isEditing={Boolean(editingRoutineId)}
              onTitleChange={handleRoutineTitleChange}
              onItemChange={handleRoutineItemChange}
              onAddItem={handleAddRoutineItem}
              onRemoveItem={handleRemoveRoutineItem}
              onSubmit={handleSubmitRoutine}
              onCancel={closeRoutineModal}
            />
          </Modal>
          <HabitDetailsModal
            habit={selectedHabit}
            isOpen={Boolean(selectedHabit)}
            onClose={() => setSelectedHabit(null)}
          />
          <ConfirmDialog
            isOpen={Boolean(confirmHabitDelete)}
            title={
              confirmHabitDelete?.archivedAt
                ? "Delete this habit permanently?"
                : "Delete this habit?"
            }
            description={
              confirmHabitDelete?.archivedAt
                ? "This action cannot be undone."
                : "This will archive the habit and keep its history."
            }
            confirmLabel={confirmHabitDelete?.archivedAt ? "Delete habit" : "Archive habit"}
            cancelLabel="Cancel"
            isLoading={actionLoading}
            onConfirm={() => {
              if (confirmHabitDelete) {
                handleDeleteHabit(confirmHabitDelete);
              }
              setConfirmHabitDelete(null);
            }}
            onCancel={() => setConfirmHabitDelete(null)}
          />
          <ConfirmDialog
            isOpen={Boolean(confirmRoutineDelete)}
            title="Delete this routine?"
            description="This action cannot be undone."
            confirmLabel="Delete routine"
            cancelLabel="Cancel"
            isLoading={actionLoading}
            onConfirm={() => {
              if (confirmRoutineDelete) {
                handleDeleteRoutine(confirmRoutineDelete);
              }
              setConfirmRoutineDelete(null);
            }}
            onCancel={() => setConfirmRoutineDelete(null)}
          />
          <ConfirmDialog
            isOpen={Boolean(linkedHabitPrompt)}
            title={
              linkedHabitPrompt
                ? `Start “${linkedHabitPrompt.target.title}”?`
                : "Start next habit?"
            }
            description={
              linkedHabitPrompt
                ? `You completed “${linkedHabitPrompt.source.title}”. Want to jump into the next habit in your chain?`
                : "Want to start the linked habit?"
            }
            confirmLabel="View habit"
            cancelLabel="Not now"
            onConfirm={() => {
              if (linkedHabitPrompt) {
                setSelectedHabit(linkedHabitPrompt.target);
                setTab("habits");
              }
              setLinkedHabitPrompt(null);
            }}
            onCancel={() => setLinkedHabitPrompt(null)}
          />
        </div>
      ) : activeTab === "focus" ? (
        <div key="focus" className="tab-transition">
          <FocusBlockPanel
            user={user}
            todos={todos}
            habits={habits}
            activeBlock={activeBlock}
            loading={isFocusLoading}
            onNotify={(message, variant) => setSnackbar({ message, variant })}
          />
        </div>
      ) : (
        <div key="review" className="tab-transition">
          <ReviewPanel
            overdueTodos={overdueTodos}
            missedHabits={missedHabits}
            onRescheduleTodo={handleRescheduleTodo}
            onSkipTodo={handleSkipTodo}
            onArchiveTodo={handleArchiveTodo}
            onRescheduleHabit={handleRescheduleHabit}
            onSkipHabit={handleSkipHabit}
            onArchiveHabit={handleArchiveHabit}
          />
        </div>
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
