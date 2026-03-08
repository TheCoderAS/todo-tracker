import { useCallback, useState } from "react";
import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  formatDateInput,
  formatTimeInput
} from "@/lib/todoFormatters";
import type { Todo, TodoInput, TodoRecurrence } from "@/lib/types";
import type { SnackbarVariant } from "@/components/ui/Snackbar";
import { normalizeTitle } from "@/hooks/todos/useTodoFormState";

type SnackbarState = {
  message: string;
  variant: SnackbarVariant;
  onUndo?: () => void;
} | null;

const getNextRecurrenceDate = (current: Date, recurrence: TodoRecurrence): Date => {
  const next = new Date(current);
  switch (recurrence) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
};

type UseTodoActionsOptions = {
  user: User | null;
  todos: Todo[];
  form: TodoInput;
  editingId: string | null;
  selectedTodo: Todo | null;
  setSelectedTodo: (todo: Todo | null) => void;
  setSnackbar: (state: SnackbarState) => void;
  setTitleHasError: (v: boolean) => void;
  setScheduleHasError: (v: boolean) => void;
  closeFormModal: () => void;
  setEditingId: (id: string | null) => void;
  setForm: React.Dispatch<React.SetStateAction<TodoInput>>;
  setIsFormOpen: (open: boolean) => void;
};

export function useTodoActions({
  user,
  todos,
  form,
  editingId,
  selectedTodo,
  setSelectedTodo,
  setSnackbar,
  setTitleHasError,
  setScheduleHasError,
  closeFormModal,
  setEditingId,
  setForm,
  setIsFormOpen
}: UseTodoActionsOptions) {
  const [actionLoading, setActionLoading] = useState(false);
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  const toggleSelectMode = useCallback(() => {
    setIsSelectMode((prev) => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
  }, []);

  const toggleSelectId = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(
    (ids: string[]) => {
      setSelectedIds(new Set(ids));
    },
    []
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleEditTodo = useCallback(
    (todo: Todo) => {
      setEditingId(todo.id);
      setForm({
        title: todo.title,
        scheduledDate: todo.scheduledDate ? formatDateInput(todo.scheduledDate) : "",
        scheduledTime: todo.scheduledDate ? formatTimeInput(todo.scheduledDate) : "",
        priority: todo.priority,
        tags: todo.tags.join(", "),
        contextTags: todo.contextTags ?? [],
        description: todo.description ?? "",
        recurrence: todo.recurrence ?? "none",
        subtasks: todo.subtasks ?? []
      });
      setIsFormOpen(true);
    },
    [setEditingId, setForm, setIsFormOpen]
  );

  const handleDeleteRequest = useCallback((todoId: string) => {
    setConfirmDeleteId(todoId);
  }, []);

  const handleDeleteTodo = useCallback(
    async (todoId: string) => {
      if (!user) return;
      const deletedTodo = todos.find((t) => t.id === todoId);
      setActionLoading(true);
      try {
        await deleteDoc(doc(db, "users", user.uid, "todos", todoId));
        if (selectedTodo?.id === todoId) {
          setSelectedTodo(null);
        }
        setSnackbar({
          message: "Todo deleted.",
          variant: "info",
          onUndo: deletedTodo
            ? async () => {
                try {
                  const { id: _id, ...data } = deletedTodo;
                  await addDoc(collection(db, "users", user.uid, "todos"), {
                    ...data,
                    author_uid: user.uid
                  });
                  setSnackbar({ message: "Todo restored.", variant: "success" });
                } catch {
                  setSnackbar({ message: "Unable to restore todo.", variant: "error" });
                }
              }
            : undefined
        });
      } catch (error) {
        setSnackbar({ message: "Unable to delete todo.", variant: "error" });
        console.error(error);
      } finally {
        setActionLoading(false);
      }
    },
    [user, todos, selectedTodo, setSelectedTodo, setSnackbar]
  );

  const handleToggleStatus = useCallback(
    async (todo: Todo) => {
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

          if (todo.recurrence && todo.recurrence !== "none" && todo.scheduledDate) {
            const currentDate = todo.scheduledDate.toDate();
            const nextDate = getNextRecurrenceDate(currentDate, todo.recurrence);
            await addDoc(collection(db, "users", user.uid, "todos"), {
              title: todo.title,
              scheduledDate: Timestamp.fromDate(nextDate),
              createdAt: serverTimestamp(),
              priority: todo.priority,
              status: "pending",
              completedDate: null,
              skippedAt: null,
              recurrence: todo.recurrence,
              author_uid: user.uid,
              tags: todo.tags,
              contextTags: todo.contextTags ?? [],
              description: todo.description
            });
          }
        }
        setSnackbar({
          message:
            nextStatus === "completed"
              ? todo.recurrence && todo.recurrence !== "none"
                ? "Completed! Next occurrence created."
                : "Todo marked as completed."
              : "Todo moved back to pending.",
          variant: "success"
        });
      } catch (error) {
        setSnackbar({ message: "Unable to update todo status.", variant: "error" });
        console.error(error);
      } finally {
        setActionLoading(false);
      }
    },
    [user, selectedTodo, setSelectedTodo, setSnackbar]
  );

  const handleToggleFlag = useCallback(
    async (todo: Todo) => {
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
    },
    [user, setSnackbar]
  );

  const handleRescheduleTodo = useCallback(
    async (todo: Todo) => {
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
    },
    [user, setSnackbar]
  );

  const handleSkipTodo = useCallback(
    async (todo: Todo) => {
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
    },
    [user, setSnackbar]
  );

  const handleArchiveTodo = useCallback(
    async (todo: Todo) => {
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
    },
    [user, setSnackbar]
  );

  const handleSubmitTodo = useCallback(
    async (event: React.FormEvent) => {
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
      const recurrence = form.recurrence === "none" ? null : form.recurrence;
      const parsedTags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      try {
        if (editingId) {
          const todoRef = doc(db, "users", user.uid, "todos", editingId);
          const existing = todos.find((todo) => todo.id === editingId);
          await updateDoc(todoRef, {
            title: normalizedTitle,
            scheduledDate,
            priority: form.priority,
            tags: parsedTags,
            contextTags: form.contextTags,
            description: form.description,
            recurrence: recurrence ?? null,
            subtasks: form.subtasks,
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
            recurrence: recurrence ?? null,
            subtasks: form.subtasks,
            author_uid: user.uid,
            tags: parsedTags,
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
    },
    [
      user,
      form,
      editingId,
      todos,
      setSnackbar,
      setTitleHasError,
      setScheduleHasError,
      closeFormModal
    ]
  );

  const handleReorder = useCallback(
    async (activeId: string, overId: string) => {
      if (!user) return;
      const allItems = todos.filter((t) => t.status === "pending");
      const oldIndex = allItems.findIndex((t) => t.id === activeId);
      const newIndex = allItems.findIndex((t) => t.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...allItems];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      try {
        const batch = await import("firebase/firestore").then((m) => m.writeBatch(db));
        reordered.forEach((todo, index) => {
          const ref = doc(db, "users", user.uid, "todos", todo.id);
          batch.update(ref, { manualOrder: index });
        });
        await batch.commit();
      } catch (error) {
        console.error(error);
        setSnackbar({ message: "Unable to save order.", variant: "error" });
      }
    },
    [user, todos, setSnackbar]
  );

  const handleBulkComplete = useCallback(async () => {
    if (!user || selectedIds.size === 0) return;
    setActionLoading(true);
    try {
      const batch = await import("firebase/firestore").then((m) => m.writeBatch(db));
      selectedIds.forEach((id) => {
        const ref = doc(db, "users", user.uid, "todos", id);
        batch.update(ref, {
          status: "completed",
          completedDate: serverTimestamp()
        });
      });
      await batch.commit();
      setSnackbar({
        message: `${selectedIds.size} todos completed.`,
        variant: "success"
      });
      setSelectedIds(new Set());
      setIsSelectMode(false);
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to complete todos.", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  }, [user, selectedIds, setSnackbar]);

  const handleBulkDelete = useCallback(async () => {
    if (!user || selectedIds.size === 0) return;
    setActionLoading(true);
    try {
      const batch = await import("firebase/firestore").then((m) => m.writeBatch(db));
      selectedIds.forEach((id) => {
        const ref = doc(db, "users", user.uid, "todos", id);
        batch.delete(ref);
      });
      await batch.commit();
      setSnackbar({
        message: `${selectedIds.size} todos deleted.`,
        variant: "info"
      });
      setSelectedIds(new Set());
      setIsSelectMode(false);
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to delete todos.", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  }, [user, selectedIds, setSnackbar]);

  return {
    actionLoading,
    lastCompletedId,
    confirmDeleteId,
    setConfirmDeleteId,
    isSelectMode,
    selectedIds,
    toggleSelectMode,
    toggleSelectId,
    selectAll,
    clearSelection,
    handleBulkComplete,
    handleBulkDelete,
    handleEditTodo,
    handleDeleteRequest,
    handleDeleteTodo,
    handleToggleStatus,
    handleToggleFlag,
    handleRescheduleTodo,
    handleSkipTodo,
    handleArchiveTodo,
    handleSubmitTodo,
    handleReorder
  };
}
