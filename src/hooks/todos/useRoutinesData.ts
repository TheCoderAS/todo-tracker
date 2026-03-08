"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import type { User } from "firebase/auth";

import { db } from "@/lib/firebase";
import type { Routine } from "@/lib/types";

export const useRoutinesData = (user: User | null | undefined) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoutines([]);
      setIsInitialLoad(false);
      return;
    }

    setIsInitialLoad(true);
    const routinesQuery = query(
      collection(db, "users", user.uid, "routines"),
      orderBy("createdAt", "desc")
    );

    let isFirstSnapshot = true;
    const unsubscribe = onSnapshot(routinesQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnapshot) => {
        const routine = docSnapshot.data() as Omit<Routine, "id">;
        const items =
          routine.items?.map((item) => ({
            ...item,
            tags: item.tags ?? [],
            contextTags: item.contextTags ?? [],
            description: item.description ?? ""
          })) ?? [];
        return {
          id: docSnapshot.id,
          ...routine,
          items
        };
      });
      setRoutines(data);
      if (isFirstSnapshot) {
        setIsInitialLoad(false);
        isFirstSnapshot = false;
      }
    });

    return () => unsubscribe();
  }, [user]);

  return { routines, isInitialLoad };
};
