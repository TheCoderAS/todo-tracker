import { useMemo, useState } from "react";

import FiltersModal from "@/components/todos/FiltersModal";
import TodoForm from "@/components/todos/TodoForm";
import TodoSection from "@/components/todos/TodoSection";
import HabitForm from "@/components/habits/HabitForm";
import HabitDetailsModal from "@/components/habits/HabitDetailsModal";
import HabitSection from "@/components/habits/HabitSection";
import FocusBlockPanel from "@/components/focus/FocusBlockPanel";
import ReviewPanel, { type MissedHabitEntry } from "@/components/review/ReviewPanel";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import OverlayLoader from "@/components/ui/OverlayLoader";
import Snackbar, { type SnackbarVariant } from "@/components/ui/Snackbar";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatDateDisplay } from "@/lib/todoFormatters";
import {
  getDateKey,
  isHabitScheduledForDate
} from "@/lib/habitUtils";
import { useHabitsData } from "@/hooks/todos/useHabitsData";
import { useTabState } from "@/hooks/todos/useTabState";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useTodoFilters } from "@/hooks/todos/useTodoFilters";
import { useTodosData } from "@/hooks/todos/useTodosData";
import { useTodoFormState, priorities } from "@/hooks/todos/useTodoFormState";
import { useTodoActions } from "@/hooks/todos/useTodoActions";
import { useHabitActions } from "@/hooks/todos/useHabitActions";
import { useFocusBlocksData } from "@/hooks/focus/useFocusBlocksData";

export default function TodosPage() {
  const { user, loading } = useAuth();
  const { todos, isInitialLoad } = useTodosData(user);
  const { habits, isInitialLoad: isHabitInitialLoad } = useHabitsData(user);
  const { activeBlock, isInitialLoad: isFocusInitialLoad } = useFocusBlocksData(user);
  const { activeTab, setTab } = useTabState();

  const [snackbar, setSnackbar] = useState<{
    message: string;
    variant: SnackbarVariant;
    onUndo?: () => void;
  } | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<
    import("@/lib/types").Todo | null
  >(null);

  const todoForm = useTodoFormState();

  const {
    statusFilter,
    priorityFilter,
    tagFilter,
    availableTags,
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

  const todoActions = useTodoActions({
    user,
    todos,
    form: todoForm.form,
    editingId: todoForm.editingId,
    selectedTodo,
    setSelectedTodo,
    setSnackbar,
    setTitleHasError: todoForm.setTitleHasError,
    setScheduleHasError: todoForm.setScheduleHasError,
    closeFormModal: todoForm.closeFormModal,
    setEditingId: todoForm.setEditingId,
    setForm: todoForm.setForm,
    setIsFormOpen: todoForm.setIsFormOpen
  });

  const habitActions = useHabitActions({ user, habits, setSnackbar });

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

  const openFilterModal = () => {
    setFilterDraft({
      status: statusFilter,
      priority: priorityFilter,
      sortBy,
      sortOrder,
      datePreset,
      selectedDate,
      tags: tagFilter
    });
    setIsFilterOpen(true);
  };

  useKeyboardShortcuts(
    useMemo(
      () => [
        {
          key: "n",
          handler: () => {
            if (activeTab === "todos") {
              todoForm.openCreateModal();
            } else if (activeTab === "habits") {
              habitActions.openHabitModal();
            }
          },
          description: "New todo/habit"
        },
        {
          key: "f",
          handler: () => {
            if (activeTab === "todos") setIsFilterOpen(true);
          },
          description: "Open filters"
        },
        { key: "1", handler: () => setTab("todos"), description: "Switch to Todos" },
        { key: "2", handler: () => setTab("habits"), description: "Switch to Habits" },
        { key: "3", handler: () => setTab("focus"), description: "Switch to Focus" },
        { key: "4", handler: () => setTab("review"), description: "Switch to Review" }
      ],
      [activeTab]
    )
  );

  const isLoading = loading || isInitialLoad;
  const isHabitLoading = loading || isHabitInitialLoad;
  const isFocusLoading = loading || isFocusInitialLoad;
  const isAnyActionLoading = todoActions.actionLoading || habitActions.habitActionLoading;

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
            onEdit={todoActions.handleEditTodo}
            onToggleStatus={todoActions.handleToggleStatus}
            onToggleFlag={todoActions.handleToggleFlag}
            onDelete={todoActions.handleDeleteRequest}
            selectedTodo={selectedTodo}
            onSelectTodo={setSelectedTodo}
            onOpenFilter={openFilterModal}
            onOpenCreate={todoForm.openCreateModal}
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
            lastCompletedId={todoActions.lastCompletedId}
            isLoading={isLoading}
            onReorder={todoActions.handleReorder}
            isSelectMode={todoActions.isSelectMode}
            selectedIds={todoActions.selectedIds}
            onToggleSelectMode={todoActions.toggleSelectMode}
            onToggleSelectId={todoActions.toggleSelectId}
            onSelectAll={todoActions.selectAll}
            onClearSelection={todoActions.clearSelection}
            onBulkComplete={todoActions.handleBulkComplete}
            onBulkDelete={todoActions.handleBulkDelete}
          />
          <Modal
            isOpen={todoForm.isFormOpen}
            onClose={todoForm.closeFormModal}
            ariaLabel="Todo form"
          >
            <TodoForm
              form={todoForm.form}
              priorities={priorities}
              isEditing={todoForm.isEditing}
              titleHasError={todoForm.titleHasError}
              scheduleHasError={todoForm.scheduleHasError}
              onChange={todoForm.handleFormChange}
              onDescriptionChange={todoForm.handleDescriptionChange}
              onSubtasksChange={todoForm.handleSubtasksChange}
              onSubmit={todoActions.handleSubmitTodo}
              onCancelEdit={todoForm.closeFormModal}
            />
          </Modal>
          <FiltersModal
            isOpen={isFilterOpen}
            filterDraft={filterDraft}
            availableTags={availableTags}
            onClose={() => setIsFilterOpen(false)}
            onApply={() => {
              handleApplyFilters();
              setIsFilterOpen(false);
            }}
            onReset={handleResetFilters}
            onDraftChange={setFilterDraft}
          />
          <ConfirmDialog
            isOpen={Boolean(todoActions.confirmDeleteId)}
            title="Delete this todo?"
            description="This action cannot be undone."
            confirmLabel="Delete todo"
            cancelLabel="Cancel"
            isLoading={todoActions.actionLoading}
            onConfirm={() => {
              if (todoActions.confirmDeleteId) {
                todoActions.handleDeleteTodo(todoActions.confirmDeleteId);
              }
              todoActions.setConfirmDeleteId(null);
            }}
            onCancel={() => todoActions.setConfirmDeleteId(null)}
          />
        </div>
      ) : activeTab === "habits" ? (
        <div key="habits" className="tab-transition">
          <HabitSection
            habits={habits}
            onToggleComplete={habitActions.handleToggleHabitCompletion}
            onOpenCreate={habitActions.openHabitModal}
            onEdit={habitActions.handleEditHabit}
            onDelete={habitActions.handleDeleteHabitRequest}
            onViewDetails={habitActions.setSelectedHabit}
            isLoading={isHabitLoading}
          />
          <Modal
            isOpen={habitActions.isHabitFormOpen}
            onClose={habitActions.closeHabitModal}
            ariaLabel="Habit form"
          >
            <HabitForm
              form={habitActions.habitForm}
              graceMissesInput={habitActions.graceMissesInput}
              habits={habits.filter((habit) => habit.id !== habitActions.editingHabitId)}
              isEditing={Boolean(habitActions.editingHabitId)}
              onChange={habitActions.handleHabitFormChange}
              onGraceMissesChange={habitActions.handleGraceMissesChange}
              onGraceMissesBlur={habitActions.handleGraceMissesBlur}
              onToggleDay={habitActions.handleHabitDayToggle}
              onDayOfMonthChange={habitActions.handleHabitDayOfMonthChange}
              onMonthChange={habitActions.handleHabitMonthChange}
              onSubmit={habitActions.handleSubmitHabit}
              onCancel={habitActions.closeHabitModal}
            />
          </Modal>
          <HabitDetailsModal
            habit={habitActions.selectedHabit}
            isOpen={Boolean(habitActions.selectedHabit)}
            onClose={() => habitActions.setSelectedHabit(null)}
          />
          <ConfirmDialog
            isOpen={Boolean(habitActions.confirmHabitDelete)}
            title={
              habitActions.confirmHabitDelete?.archivedAt
                ? "Delete this habit permanently?"
                : "Delete this habit?"
            }
            description={
              habitActions.confirmHabitDelete?.archivedAt
                ? "This action cannot be undone."
                : "This will archive the habit and keep its history."
            }
            confirmLabel={
              habitActions.confirmHabitDelete?.archivedAt
                ? "Delete habit"
                : "Archive habit"
            }
            cancelLabel="Cancel"
            isLoading={habitActions.habitActionLoading}
            onConfirm={() => {
              if (habitActions.confirmHabitDelete) {
                habitActions.handleDeleteHabit(habitActions.confirmHabitDelete);
              }
              habitActions.setConfirmHabitDelete(null);
            }}
            onCancel={() => habitActions.setConfirmHabitDelete(null)}
          />
          <ConfirmDialog
            isOpen={Boolean(habitActions.linkedHabitPrompt)}
            title={
              habitActions.linkedHabitPrompt
                ? `Start "${habitActions.linkedHabitPrompt.target.title}"?`
                : "Start next habit?"
            }
            description={
              habitActions.linkedHabitPrompt
                ? `You completed "${habitActions.linkedHabitPrompt.source.title}". Want to jump into the next habit in your chain?`
                : "Want to start the linked habit?"
            }
            confirmLabel="View habit"
            cancelLabel="Not now"
            onConfirm={() => {
              if (habitActions.linkedHabitPrompt) {
                habitActions.setSelectedHabit(habitActions.linkedHabitPrompt.target);
                setTab("habits");
              }
              habitActions.dismissLinkedHabitPrompt();
            }}
            onCancel={() => habitActions.dismissLinkedHabitPrompt()}
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
            onRescheduleTodo={todoActions.handleRescheduleTodo}
            onSkipTodo={todoActions.handleSkipTodo}
            onArchiveTodo={todoActions.handleArchiveTodo}
            onRescheduleHabit={habitActions.handleRescheduleHabit}
            onSkipHabit={habitActions.handleSkipHabit}
            onArchiveHabit={habitActions.handleArchiveHabit}
          />
        </div>
      )}
      {isAnyActionLoading ? <OverlayLoader /> : null}
      {snackbar ? (
        <Snackbar
          message={snackbar.message}
          variant={snackbar.variant}
          onDismiss={() => setSnackbar(null)}
          onUndo={snackbar.onUndo}
        />
      ) : null}
    </section>
  );
}
