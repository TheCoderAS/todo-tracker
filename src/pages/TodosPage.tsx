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
import type {
  Habit,
  HabitFrequency,
  HabitInput,
  Todo,
  TodoInput,
  TodoPriority
} from "@/lib/types";
import { useHabitsData } from "@/hooks/todos/useHabitsData";
import { useTabState } from "@/hooks/todos/useTabState";
import { useTodoFilters } from "@/hooks/todos/useTodoFilters";
import { useTodosData } from "@/hooks/todos/useTodosData";

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
  const { activeTab, setTab } = useTabState();
  const [form, setForm] = useState<TodoInput>(defaultForm);
  const [habitForm, setHabitForm] = useState<HabitInput>({
    title: "",
    reminderTime: "",
    reminderDays: getDefaultReminderDays("daily"),
    frequency: "daily",
    graceMisses: 0
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [titleHasError, setTitleHasError] = useState(false);
  const [scheduleHasError, setScheduleHasError] = useState(false);
  const [confirmHabitDelete, setConfirmHabitDelete] = useState<Habit | null>(null);
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
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    let nextValue: string | number = value;
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
      reminderTime: formatTimeValue(now),
      reminderDays: getDefaultReminderDays("daily"),
      frequency: "daily",
      graceMisses: 0
    });
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
          title: normalizedTitle,
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

  const handleHabitFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    let nextValue = value;
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
    if (name === "graceMisses") {
      const nextNumber = Number.parseInt(value, 10);
      nextValue = Number.isNaN(nextNumber) ? 0 : Math.max(nextNumber, 0);
    }
    setHabitForm((prev) => ({ ...prev, [name]: nextValue }));
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
          reminderTime: habitForm.reminderTime,
          reminderDays: habitForm.reminderDays,
          frequency: habitForm.frequency,
          graceMisses: habitForm.graceMisses,
          updatedAt: serverTimestamp()
        });
        setSnackbar({ message: "Habit updated.", variant: "success" });
      } else {
        await addDoc(collection(db, "users", user.uid, "habits"), {
          title: normalizedHabitTitle,
          reminderTime: habitForm.reminderTime,
          reminderDays: habitForm.reminderDays,
          frequency: habitForm.frequency,
          graceMisses: habitForm.graceMisses,
          completionDates: [],
          timezone: getLocalTimeZone(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          author_uid: user.uid,
          lastNotifiedDate: null,
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

  const handleEditHabit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setHabitForm({
      title: habit.title,
      reminderTime: habit.reminderTime,
      reminderDays: habit.reminderDays?.length
        ? habit.reminderDays
        : getDefaultReminderDays(habit.frequency),
      frequency: habit.frequency,
      graceMisses: habit.graceMisses ?? 0
    });
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
      ) : (
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
          <Modal
            isOpen={isHabitFormOpen}
            onClose={closeHabitModal}
            ariaLabel="Habit form"
          >
            <HabitForm
              form={habitForm}
              isEditing={Boolean(editingHabitId)}
              onChange={handleHabitFormChange}
              onToggleDay={handleHabitDayToggle}
              onDayOfMonthChange={handleHabitDayOfMonthChange}
              onMonthChange={handleHabitMonthChange}
              onSubmit={handleSubmitHabit}
              onCancel={closeHabitModal}
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
