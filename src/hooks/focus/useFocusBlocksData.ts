"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import type { User } from "firebase/auth";

import { db } from "@/lib/firebase";
import type { FocusBlock } from "@/lib/types";

export const useFocusBlocksData = (user: User | null | undefined) => {
  const [focusBlocks, setFocusBlocks] = useState<FocusBlock[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!user) {
      setFocusBlocks([]);
      setIsInitialLoad(false);
      return;
    }

    setIsInitialLoad(true);
    const focusQuery = query(
      collection(db, "users", user.uid, "focusBlocks"),
      orderBy("createdAt", "desc")
    );

    let isFirstSnapshot = true;
    const unsubscribe = onSnapshot(focusQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<FocusBlock, "id">)
      }));
      setFocusBlocks(data);
      if (isFirstSnapshot) {
        setIsInitialLoad(false);
        isFirstSnapshot = false;
      }
    });

    return () => unsubscribe();
  }, [user]);

  const activeBlock = useMemo(
    () => focusBlocks.find((block) => block.status === "active") ?? null,
    [focusBlocks]
  );

  return { focusBlocks, activeBlock, isInitialLoad };
};
