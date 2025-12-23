"use client";

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
  formatTimeInput
} from "@/lib/todoFormatters";
import type { Habit, HabitInput, Todo, TodoInput, TodoPriority } from "@/lib/types";
import { useHabitsData } from "@/app/(app)/todos/hooks/useHabitsData";
import { useTabState } from "@/app/(app)/todos/hooks/useTabState";
import { useTodoFilters } from "@/app/(app)/todos/hooks/useTodoFilters";
import { useTodosData } from "@/app/(app)/todos/hooks/useTodosData";

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
  const { todos, isInitialLoad } = useTodosData(user);
  const { habits, isInitialLoad: isHabitInitialLoad } = useHabitsData(user);
  const { activeTab, setTab } = useTabState();
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
  const {
    statusFilter,
    priorityFilter,
    sortOrder,
    sortBy,
    datePreset,
    selectedDate,
    filterDraft,
    groupedTodos,
    todayStats,
    streakCount,
    emptyStateLabel,
    setSortBy,
    setSortOrder,
    setFilterDraft,
    handleApplyFilters,
    handleResetFilters,
    handleQuickFilter
  } = useTodoFilters(todos);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null);

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
        author_uid: user.uid,
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
