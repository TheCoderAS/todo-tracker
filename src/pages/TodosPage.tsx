import { useMemo, useState } from "react";

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
import { formatDateDisplay } from "@/lib/todoFormatters";
import { useHabitsData } from "@/hooks/todos/useHabitsData";
import { useTabState } from "@/hooks/todos/useTabState";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useTodoFilters } from "@/hooks/todos/useTodoFilters";
import { useTodosData } from "@/hooks/todos/useTodosData";
import { useTodoFormState, priorities } from "@/hooks/todos/useTodoFormState";
import { useTodoActions } from "@/hooks/todos/useTodoActions";
import { useHabitActions } from "@/hooks/todos/useHabitActions";

export default function TodosPage() {
  const { user, loading } = useAuth();
  const { todos, isInitialLoad } = useTodosData(user);
  const { habits, isInitialLoad: isHabitInitialLoad } = useHabitsData(user);
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

  const habitActions = useHabitActions({ user, setSnackbar });

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
            } else {
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
        { key: "2", handler: () => setTab("habits"), description: "Switch to Habits" }
      ],
      [activeTab]
    )
  );

  const isLoading = loading || isInitialLoad;
  const isHabitLoading = loading || isHabitInitialLoad;
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
      ) : (
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
              isEditing={Boolean(habitActions.editingHabitId)}
              onChange={habitActions.handleHabitFormChange}
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
            isOpen={Boolean(habitActions.confirmHabitDeleteId)}
            title="Delete this habit?"
            description="This will archive the habit and keep its history."
            confirmLabel="Archive habit"
            cancelLabel="Cancel"
            isLoading={habitActions.habitActionLoading}
            onConfirm={() => {
              if (habitActions.confirmHabitDeleteId) {
                habitActions.handleDeleteHabit(habitActions.confirmHabitDeleteId);
              }
              habitActions.setConfirmHabitDeleteId(null);
            }}
            onCancel={() => habitActions.setConfirmHabitDeleteId(null)}
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
