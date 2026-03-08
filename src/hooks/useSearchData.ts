import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import type { User } from "firebase/auth";

import { db } from "@/lib/firebase";
import type { Habit, Todo } from "@/lib/types";

export const useSearchData = (user: User | null | undefined) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    if (!user) {
      setTodos([]);
      setHabits([]);
      return;
    }

    const todosQuery = query(
      collection(db, "users", user.uid, "todos"),
      orderBy("createdAt", "desc")
    );
    const habitsQuery = query(
      collection(db, "users", user.uid, "habits"),
      orderBy("createdAt", "desc")
    );

    const unsubTodos = onSnapshot(todosQuery, (snapshot) => {
      setTodos(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Todo, "id">)
        }))
      );
    });

    const unsubHabits = onSnapshot(habitsQuery, (snapshot) => {
      setHabits(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Habit, "id">)
        }))
      );
    });

    return () => {
      unsubTodos();
      unsubHabits();
    };
  }, [user]);

  return { todos, habits };
};
