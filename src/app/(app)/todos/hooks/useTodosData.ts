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

  return { todos, isInitialLoad };
};
