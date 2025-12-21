"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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

import AuthForm, { type AuthFormState, type AuthMode } from "@/components/auth/AuthForm";
import AuthIntro from "@/components/auth/AuthIntro";
import TodoForm from "@/components/todos/TodoForm";
import TodoList from "@/components/todos/TodoList";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import OverlayLoader from "@/components/ui/OverlayLoader";
import Snackbar, { type SnackbarVariant } from "@/components/ui/Snackbar";
import { auth, db } from "@/lib/firebase";
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

const formatDateInput = (timestamp: Timestamp | null) =>
  timestamp ? timestamp.toDate().toISOString().split("T")[0] : "";

const formatTimeInput = (timestamp: Timestamp | null) => {
  if (!timestamp) return "";
  const date = timestamp.toDate();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const formatDateDisplay = (timestamp: Timestamp | null) =>
  timestamp
    ? timestamp.toDate().toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
      })
    : "Not scheduled";

const formatGroupTitle = (date: Date) => {
  const datePart = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const dayPart = date.toLocaleDateString("en-US", { weekday: "long" });
  return `${datePart} - ${dayPart}`;
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
  const [snackbar, setSnackbar] = useState<{
    message: string;
    variant: SnackbarVariant;
  } | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    { type: "signout" } | { type: "delete"; todoId: string } | null
  >(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "title" && value.trim()) {
      setTitleHasError(false);
    }
  };

  const handleDescriptionChange = (value: string) => {
    setForm((prev) => ({ ...prev, description: value }));
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setTitleHasError(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsFormOpen(true);
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

    if (!form.title.trim()) {
      setTitleHasError(true);
      setActionLoading(false);
      return;
    }

    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const scheduledDate = form.scheduledDate
      ? Timestamp.fromDate(
          new Date(
            `${form.scheduledDate}T${form.scheduledTime ? form.scheduledTime : "00:00"}`
          )
        )
      : null;

    try {
      if (editingId) {
        const todoRef = doc(db, "users", user.uid, "todos", editingId);
        await updateDoc(todoRef, {
          title: form.title.trim(),
          scheduledDate,
          priority: form.priority,
          tags,
          description: form.description.trim(),
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "users", user.uid, "todos"), {
          author_uid: user.uid,
          title: form.title.trim(),
          status: "pending",
          scheduledDate,
          completedDate: null,
          priority: form.priority,
          tags,
          description: form.description.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
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
    if (todos.length === 0) return [];

    const groups = new Map<string, { title: string; items: Todo[]; sortKey: number }>();
    const unscheduled: Todo[] = [];

    todos.forEach((todo) => {
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
      .sort((a, b) => a.sortKey - b.sortKey)
      .map((group) => ({
        title: group.title,
        items: group.items.sort((a, b) => {
          if (!a.scheduledDate || !b.scheduledDate) return 0;
          return a.scheduledDate.toMillis() - b.scheduledDate.toMillis();
        })
      }));

    if (unscheduled.length) {
      orderedGroups.push({ title: "Unscheduled", items: unscheduled });
    }

    return orderedGroups;
  }, [todos]);

  if (authLoading || isInitialLoad) {
    return (
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 pb-20 pt-6 text-slate-100">
        <OverlayLoader />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 pb-20 pt-6 text-slate-100">
      <header className="sticky top-0 z-30 -mx-6 flex items-center justify-between gap-6 border-b border-slate-900/60 bg-slate-950/85 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 shadow-xl shadow-slate-900/40">
            <Image
              src="/aura-pulse.png"
              alt="Aura Pulse logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl object-cover"
              priority
            />
          </div>
        </div>
        {user ? (
          <button
            className="rounded-full border border-slate-700/70 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
            onClick={handleSignOutRequest}
          >
            Sign out
          </button>
        ) : null}
      </header>

      {!user ? (
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <AuthIntro />
          <AuthForm
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
        </section>
      ) : (
        <section className="grid gap-6">
          <section className="grid gap-4">
            <h2 className="text-xl font-semibold text-white">Your todos</h2>
            <TodoList
              groups={groupedTodos}
              formatDate={formatDateDisplay}
              onEdit={handleEditTodo}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteRequest}
            />
          </section>
          <button
            type="button"
            className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400 text-3xl font-semibold text-slate-950 shadow-xl shadow-slate-950/40 transition hover:bg-emerald-300"
            onClick={openCreateModal}
            aria-label="Add todo"
          >
            +
          </button>
        </section>
      )}
      <Modal isOpen={isFormOpen} onClose={closeFormModal} ariaLabel="Todo form">
        <TodoForm
          form={form}
          priorities={priorities}
          isEditing={isEditing}
          titleHasError={titleHasError}
          onChange={handleFormChange}
          onDescriptionChange={handleDescriptionChange}
          onSubmit={handleSubmitTodo}
          onCancelEdit={closeFormModal}
        />
      </Modal>
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
