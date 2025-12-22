"use client";

import { useEffect, useMemo, useState } from "react";
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
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import OverlayLoader from "@/components/ui/OverlayLoader";
import Snackbar, { type SnackbarVariant } from "@/components/ui/Snackbar";
import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/firebase";
import {
  formatDateDisplay,
  formatDateInput,
  formatGroupTitle,
  formatTimeInput
} from "@/lib/todoFormatters";
import type { Todo, TodoInput, TodoPriority } from "@/lib/types";

const priorities: TodoPriority[] = ["low", "medium", "high"];

const defaultForm: TodoInput = {
  title: "",
  scheduledDate: "",
  scheduledTime: "",
  priority: "medium",
  tags: "",
  description: ""
};

export default function TodosPage() {
  const { user, loading } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [form, setForm] = useState<TodoInput>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    sortOrder: "asc"
  };
  const [statusFilter, setStatusFilter] = useState<"all" | Todo["status"]>(
    defaultFilters.status
  );
  const [priorityFilter, setPriorityFilter] = useState<"all" | TodoPriority>(
    defaultFilters.priority
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultFilters.sortOrder);
  const [filterDraft, setFilterDraft] = useState<FilterDraft>(defaultFilters);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  useEffect(() => {
    if (!user) {
      setTodos([]);
      setIsInitialLoad(false);
      return;
    }

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
  }, [user]);

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
    if (name === "scheduledDate" || name === "scheduledTime") {
      if (nextValue.trim()) {
        setScheduleHasError(false);
      }
    }
    setForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleDescriptionChange = (value: string) => {
    setForm((prev) => ({ ...prev, description: value }));
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setTitleHasError(false);
    setScheduleHasError(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openFilterModal = () => {
    setFilterDraft({
      status: statusFilter,
      priority: priorityFilter,
      sortOrder
    });
    setIsFilterOpen(true);
  };

  const closeFormModal = () => {
    resetForm();
    setIsFormOpen(false);
  };

  const handleApplyFilters = () => {
    setStatusFilter(filterDraft.status);
    setPriorityFilter(filterDraft.priority);
    setSortOrder(filterDraft.sortOrder);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setFilterDraft(defaultFilters);
    setStatusFilter(defaultFilters.status);
    setPriorityFilter(defaultFilters.priority);
    setSortOrder(defaultFilters.sortOrder);
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

    if (!form.scheduledDate || !form.scheduledTime) {
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

  const groupedTodos = useMemo(() => {
    const filteredTodos = todos.filter((todo) => {
      const matchesStatus = statusFilter === "all" || todo.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || todo.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    });

    if (filteredTodos.length === 0) return [];

    const groups = new Map<string, { title: string; items: Todo[]; sortKey: number }>();
    const unscheduled: Todo[] = [];
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    filteredTodos.forEach((todo) => {
      if (!todo.scheduledDate) {
        unscheduled.push(todo);
        return;
      }

      const date = todo.scheduledDate.toDate();
      const dateKey = formatGroupTitle(date);
      const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const existing = groups.get(dateKey);
      if (existing) {
        existing.items.push(todo);
      } else {
        groups.set(dateKey, { title: dateKey, items: [todo], sortKey: midnight });
      }
    });

    const orderedGroups = Array.from(groups.values())
      .sort((a, b) => (a.sortKey - b.sortKey) * sortDirection)
      .map((group) => ({
        title: group.title,
        items: group.items.sort((a, b) => {
          if (!a.scheduledDate || !b.scheduledDate) return 0;
          return (a.scheduledDate.toMillis() - b.scheduledDate.toMillis()) * sortDirection;
        })
      }));

    if (unscheduled.length) {
      unscheduled.sort((a, b) => a.title.localeCompare(b.title));
      orderedGroups.push({ title: "Unscheduled", items: unscheduled });
    }

    return orderedGroups;
  }, [todos, statusFilter, priorityFilter, sortOrder]);

  if (loading || isInitialLoad) {
    return (
      <section className="relative z-10 flex min-h-[60vh] items-center justify-center">
        <OverlayLoader />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <TodoSection
        groups={groupedTodos}
        formatDate={formatDateDisplay}
        onEdit={handleEditTodo}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteRequest}
        selectedTodo={selectedTodo}
        onSelectTodo={setSelectedTodo}
        onOpenFilter={openFilterModal}
        onOpenCreate={openCreateModal}
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
