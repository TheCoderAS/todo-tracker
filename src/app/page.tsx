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
  updateDoc
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import type { Todo, TodoInput, TodoPriority } from "@/lib/types";

const priorities: TodoPriority[] = ["low", "medium", "high"];

const defaultForm: TodoInput = {
  title: "",
  scheduledDate: "",
  priority: "medium",
  tags: ""
};

const formatDateInput = (timestamp: Timestamp | null) =>
  timestamp ? timestamp.toDate().toISOString().split("T")[0] : "";

const formatDateDisplay = (timestamp: Timestamp | null) =>
  timestamp ? timestamp.toDate().toLocaleDateString() : "Not scheduled";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [form, setForm] = useState<TodoInput>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState<string | null>(null);
  const [todoError, setTodoError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
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

    const unsubscribe = onSnapshot(todosQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<Todo, "id">)
      }));
      setTodos(data);
    });

    return () => unsubscribe();
  }, [user]);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  const handleAuthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const handleEmailSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
    } catch (error) {
      setAuthError("Unable to sign in with email/password.");
      console.error(error);
    }
  };

  const handleEmailSignUp = async () => {
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(
        auth,
        authForm.email,
        authForm.password
      );
    } catch (error) {
      setAuthError("Unable to create account.");
      console.error(error);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      setAuthError("Unable to sign in with Google.");
      console.error(error);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleSubmitTodo = async (event: React.FormEvent) => {
    event.preventDefault();
    setTodoError(null);

    if (!user) {
      setTodoError("Sign in to manage todos.");
      return;
    }

    if (!form.title.trim()) {
      setTodoError("Title is required.");
      return;
    }

    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const scheduledDate = form.scheduledDate
      ? Timestamp.fromDate(new Date(form.scheduledDate))
      : null;

    try {
      if (editingId) {
        const todoRef = doc(db, "users", user.uid, "todos", editingId);
        await updateDoc(todoRef, {
          title: form.title.trim(),
          scheduledDate,
          priority: form.priority,
          tags,
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
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      resetForm();
    } catch (error) {
      setTodoError("Unable to save todo.");
      console.error(error);
    }
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingId(todo.id);
    setForm({
      title: todo.title,
      scheduledDate: formatDateInput(todo.scheduledDate),
      priority: todo.priority,
      tags: todo.tags.join(", ")
    });
  };

  const handleToggleStatus = async (todo: Todo) => {
    if (!user) return;

    const todoRef = doc(db, "users", user.uid, "todos", todo.id);
    const isCompleted = todo.status === "completed";

    await updateDoc(todoRef, {
      status: isCompleted ? "pending" : "completed",
      completedDate: isCompleted ? null : serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };

  const handleDeleteTodo = async (todoId: string) => {
    if (!user) return;

    await deleteDoc(doc(db, "users", user.uid, "todos", todoId));
  };

  return (
    <main>
      <header>
        <div>
          <h1>Todo Tracker</h1>
          <p className="small">
            Keep an eye on priorities, schedule dates, and completion history.
          </p>
        </div>
        {user ? (
          <button className="secondary" onClick={handleSignOut}>
            Sign out
          </button>
        ) : null}
      </header>

      {!user ? (
        <section className="card stack">
          <h2>Sign in to your workspace</h2>
          <div className="row">
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={handleAuthChange}
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={handleAuthChange}
            />
          </div>
          {authError ? <p className="small">{authError}</p> : null}
          <div className="row">
            <button onClick={handleEmailSignIn} disabled={authLoading}>
              Email sign in
            </button>
            <button className="secondary" onClick={handleEmailSignUp}>
              Create account
            </button>
            <button className="secondary" onClick={handleGoogleSignIn}>
              Google sign in
            </button>
          </div>
        </section>
      ) : (
        <section className="stack">
          <form className="card stack" onSubmit={handleSubmitTodo}>
            <h2>{isEditing ? "Edit todo" : "Add a new todo"}</h2>
            <input
              name="title"
              placeholder="Todo title"
              value={form.title}
              onChange={handleFormChange}
            />
            <div className="row">
              <label className="row">
                <span className="small">Scheduled date</span>
                <input
                  name="scheduledDate"
                  type="date"
                  value={form.scheduledDate}
                  onChange={handleFormChange}
                />
              </label>
              <label className="row">
                <span className="small">Priority</span>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleFormChange}
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>
              <label className="row">
                <span className="small">Tags</span>
                <input
                  name="tags"
                  placeholder="design, research"
                  value={form.tags}
                  onChange={handleFormChange}
                />
              </label>
            </div>
            {todoError ? <p className="small">{todoError}</p> : null}
            <div className="row">
              <button type="submit">{isEditing ? "Save changes" : "Add"}</button>
              {isEditing ? (
                <button
                  type="button"
                  className="secondary"
                  onClick={resetForm}
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>

          <section className="stack">
            <h2>Your todos</h2>
            {todos.length === 0 ? (
              <p className="small">No todos yet. Add one above.</p>
            ) : (
              todos.map((todo) => (
                <article key={todo.id} className="todo-item">
                  <div className="row">
                    <strong>{todo.title}</strong>
                    <span className="badge">{todo.priority}</span>
                    <span className="badge">{todo.status}</span>
                  </div>
                  <div className="row small">
                    <span>Scheduled: {formatDateDisplay(todo.scheduledDate)}</span>
                    <span>
                      Completed:{" "}
                      {todo.completedDate
                        ? formatDateDisplay(todo.completedDate)
                        : "Not completed"}
                    </span>
                  </div>
                  <div className="row small">
                    <span>Tags: {todo.tags.length ? todo.tags.join(", ") : "—"}</span>
                  </div>
                  <div className="todo-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => handleEditTodo(todo)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => handleToggleStatus(todo)}
                    >
                      {todo.status === "completed"
                        ? "Mark pending"
                        : "Mark complete"}
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => handleDeleteTodo(todo.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        </section>
      )}
    </main>
  );
}
