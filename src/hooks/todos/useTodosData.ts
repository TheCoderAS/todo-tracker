"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import type { User } from "firebase/auth";

import { db } from "@/lib/firebase";
import type { Todo } from "@/lib/types";

export const useTodosData = (user: User | null | undefined) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!user) {
      setTodos([]);
      setIsInitialLoad(false);
      return;
    }

    setIsInitialLoad(true);
    const todosQuery = query(
      collection(db, "users", user.uid, "todos"),
      orderBy("createdAt", "desc")
    );

    let isFirstSnapshot = true;
    const unsubscribe = onSnapshot(todosQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnapshot) => {
        const todo = docSnapshot.data() as Omit<Todo, "id">;
        return {
          id: docSnapshot.id,
          ...todo,
          tags: todo.tags ?? [],
          contextTags: todo.contextTags ?? [],
          description: todo.description ?? ""
        };
      });
      setTodos(data);
      if (isFirstSnapshot) {
        setIsInitialLoad(false);
        isFirstSnapshot = false;
      }
    });

    return () => unsubscribe();
  }, [user]);

  return { todos, isInitialLoad };
};
