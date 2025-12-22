"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User
} from "firebase/auth";
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
  updateDoc,
  setDoc
} from "firebase/firestore";

import AuthSection from "@/components/auth/AuthSection";
import type { AuthFormState, AuthMode } from "@/components/auth/AuthForm";
import AppHeader from "@/components/layout/AppHeader";
import FiltersModal, { type FilterDraft } from "@/components/todos/FiltersModal";
import TodoForm from "@/components/todos/TodoForm";
import TodoSection from "@/components/todos/TodoSection";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import OverlayLoader from "@/components/ui/OverlayLoader";
import Snackbar, { type SnackbarVariant } from "@/components/ui/Snackbar";
import { auth, db } from "@/lib/firebase";
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

const defaultAuthForm: AuthFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  gender: "",
  password: ""
};

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [form, setForm] = useState<TodoInput>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [authForm, setAuthForm] = useState<AuthFormState>(defaultAuthForm);
  const [authFieldErrors, setAuthFieldErrors] = useState<
    Partial<Record<keyof AuthFormState, boolean>>
  >({});
  const [authError, setAuthError] = useState<string | null>(null);
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
  const [confirmAction, setConfirmAction] = useState<
    { type: "signout" } | { type: "delete"; todoId: string } | null
  >(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        setIsInitialLoad(true);
      } else {
        setIsInitialLoad(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setTodos([]);
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

  const handleAuthChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
    setAuthFieldErrors((prev) => ({ ...prev, [name]: false }));
  };

  const validateAuthFields = (fields: (keyof AuthFormState)[]) => {
    const nextErrors: Partial<Record<keyof AuthFormState, boolean>> = {};
    fields.forEach((field) => {
      if (!authForm[field].trim()) {
        nextErrors[field] = true;
      }
    });

    setAuthFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setAuthError("Please fill in the required fields.");
      return false;
    }

    return true;
  };

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
    setSelectedTodo(null);
    setIsFormOpen(true);
  };

  const openFilterModal = () => {
    setFilterDraft({ status: statusFilter, priority: priorityFilter, sortOrder });
    setIsFilterOpen(true);
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

  const closeFormModal = () => {
    resetForm();
    setIsFormOpen(false);
  };

  const handleEmailSignIn = async () => {
    setAuthError(null);
    if (!validateAuthFields(["email", "password"])) {
      return;
    }
    setActionLoading(true);
    try {
      await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
      setSnackbar({ message: "Welcome back! You are signed in.", variant: "success" });
      setAuthForm(defaultAuthForm);
    } catch (error) {
      setAuthError("Unable to sign in with email/password.");
      setSnackbar({ message: "Unable to sign in with email/password.", variant: "error" });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    setAuthError(null);
    if (!validateAuthFields(["firstName", "lastName", "email", "password"])) {
      return;
    }
    setActionLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        authForm.email,
        authForm.password
      );
      await setDoc(doc(db, "users", credential.user.uid), {
        firstName: authForm.firstName.trim(),
        lastName: authForm.lastName.trim(),
        email: authForm.email.trim(),
        phone: authForm.phone.trim(),
        gender: authForm.gender,
        createdAt: serverTimestamp()
      });
      setSnackbar({ message: "Account created! Welcome to Aura Pulse.", variant: "success" });
      setAuthForm(defaultAuthForm);
    } catch (error) {
      setAuthError("Unable to create account.");
      setSnackbar({ message: "Unable to create account.", variant: "error" });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setActionLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setSnackbar({ message: "Signed in with Google.", variant: "success" });
    } catch (error) {
      setAuthError("Unable to sign in with Google.");
      setSnackbar({ message: "Unable to sign in with Google.", variant: "error" });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    setActionLoading(true);
    try {
      await signOut(auth);
      setSnackbar({ message: "Signed out successfully.", variant: "info" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    if (confirmAction.type === "signout") {
      await handleSignOut();
    } else {
      await handleDeleteTodo(confirmAction.todoId);
    }

    setConfirmAction(null);
  };

  const handleConfirmDismiss = () => {
    if (actionLoading) return;
    setConfirmAction(null);
  };

  const handleSubmitTodo = async (event: React.FormEvent) => {
    event.preventDefault();
    setActionLoading(true);

    if (!user) {
      setSnackbar({ message: "Sign in to manage todos.", variant: "error" });
      setActionLoading(false);
      return;
    }

    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      setTitleHasError(true);
      setActionLoading(false);
      return;
    }
    if (trimmedTitle.length > 24) {
      setTitleHasError(true);
      setSnackbar({ message: "Title must be less than 25 characters.", variant: "error" });
      setActionLoading(false);
      return;
    }

    if (!form.scheduledDate || !form.scheduledTime) {
      setScheduleHasError(true);
      setSnackbar({ message: "Please add a due date and time.", variant: "error" });
      setActionLoading(false);
      return;
    }

    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const scheduledDate = Timestamp.fromDate(
      new Date(`${form.scheduledDate}T${form.scheduledTime}`)
    );
    const scheduledDateValue = scheduledDate.toDate();
    const now = new Date();
    const oneYearFromNow = new Date(
      now.getFullYear() + 1,
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes()
    );

    if (scheduledDateValue.getTime() <= now.getTime()) {
      setScheduleHasError(true);
      setSnackbar({ message: "Due date must be in the future.", variant: "error" });
      setActionLoading(false);
      return;
    }

    if (scheduledDateValue.getTime() >= oneYearFromNow.getTime()) {
      setScheduleHasError(true);
      setSnackbar({
        message: "Due date must be within the next year.",
        variant: "error"
      });
      setActionLoading(false);
      return;
    }

    try {
      const normalizedTags = tags.map((tag) => tag.toLowerCase());
      const savedTodoBase = {
        title: trimmedTitle,
        scheduledDate,
        priority: form.priority,
        tags: normalizedTags,
        description: form.description.trim()
      };
      if (editingId) {
        const todoRef = doc(db, "users", user.uid, "todos", editingId);
        await updateDoc(todoRef, {
          ...savedTodoBase,
          updatedAt: serverTimestamp()
        });
        const existing = todos.find((todo) => todo.id === editingId);
        setSelectedTodo(
          existing
            ? { ...existing, ...savedTodoBase }
            : {
                id: editingId,
                status: "pending",
                completedDate: null,
                ...savedTodoBase
              }
        );
      } else {
        const docRef = await addDoc(collection(db, "users", user.uid, "todos"), {
          author_uid: user.uid,
          title: trimmedTitle,
          status: "pending",
          scheduledDate,
          completedDate: null,
          priority: form.priority,
          tags: normalizedTags,
          description: form.description.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setSelectedTodo({
          id: docRef.id,
          status: "pending",
          completedDate: null,
          ...savedTodoBase
        });
      }

      resetForm();
      setIsFormOpen(false);
      setSnackbar({
        message: editingId ? "Todo updated successfully." : "Todo added to your list.",
        variant: "success"
      });
    } catch (error) {
      setSnackbar({ message: "Unable to save todo.", variant: "error" });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingId(todo.id);
    setForm({
      title: todo.title,
      scheduledDate: formatDateInput(todo.scheduledDate),
      scheduledTime: formatTimeInput(todo.scheduledDate),
      priority: todo.priority,
      tags: todo.tags.join(", "),
      description: todo.description ?? ""
    });
    setSelectedTodo(null);
    setIsFormOpen(true);
  };

  const handleToggleStatus = async (todo: Todo) => {
    if (!user) return;

    const todoRef = doc(db, "users", user.uid, "todos", todo.id);
    const isCompleted = todo.status === "completed";

    setActionLoading(true);
    try {
      await updateDoc(todoRef, {
        status: isCompleted ? "pending" : "completed",
        completedDate: isCompleted ? null : serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSnackbar({
        message: isCompleted ? "Todo marked as pending." : "Todo marked as completed.",
        variant: "info"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    if (!user) return;

    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "users", user.uid, "todos", todoId));
      setSnackbar({ message: "Todo deleted.", variant: "info" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRequest = (todoId: string) => {
    setConfirmAction({ type: "delete", todoId });
  };

  const handleSignOutRequest = () => {
    setConfirmAction({ type: "signout" });
  };

  useEffect(() => {
    if (!snackbar) return;
    const timer = window.setTimeout(() => setSnackbar(null), 3000);
    return () => window.clearTimeout(timer);
  }, [snackbar]);

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

  if (authLoading || isInitialLoad) {
    return (
    <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 pb-20 pt-6 text-slate-100">
      <OverlayLoader />
    </main>
  );
}

  return (
    <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 pb-20 pt-4 text-slate-100">
      <AppHeader showSignOut={Boolean(user)} onSignOut={handleSignOutRequest} />

      {!user ? (
        <AuthSection
          mode={authMode}
          form={authForm}
          fieldErrors={authFieldErrors}
          error={authError}
          isLoading={authLoading}
          onModeChange={setAuthMode}
          onChange={handleAuthChange}
          onEmailSignIn={handleEmailSignIn}
          onEmailSignUp={handleEmailSignUp}
          onGoogleSignIn={handleGoogleSignIn}
        />
      ) : (
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
      )}
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
        isOpen={Boolean(confirmAction)}
        title={
          confirmAction?.type === "signout"
            ? "Sign out of Aura Pulse?"
            : "Delete this todo?"
        }
        description={
          confirmAction?.type === "signout"
            ? "You will be signed out and need to log in again to access your todos."
            : "This action cannot be undone."
        }
        confirmLabel={confirmAction?.type === "signout" ? "Sign out" : "Delete todo"}
        cancelLabel="Cancel"
        isLoading={actionLoading}
        onConfirm={handleConfirmAction}
        onCancel={handleConfirmDismiss}
      />
      {authLoading || actionLoading ? <OverlayLoader /> : null}
      {snackbar ? (
        <Snackbar
          message={snackbar.message}
          variant={snackbar.variant}
          onDismiss={() => setSnackbar(null)}
        />
      ) : null}
    </main>
  );
}
