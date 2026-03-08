import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { db } from "@/lib/firebase";

export function useOnboarding(user: User | null) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) {
      setChecked(true);
      return;
    }

    let cancelled = false;
    const check = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "settings", "preferences"));
        if (cancelled) return;
        const data = snap.data();
        if (!data?.onboardingCompleted) {
          setShowOnboarding(true);
        }
      } catch {
        // silently ignore — don't block the app
      } finally {
        if (!cancelled) setChecked(true);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [user]);

  const completeOnboarding = async () => {
    setShowOnboarding(false);
    if (!user) return;
    try {
      await setDoc(
        doc(db, "users", user.uid, "settings", "preferences"),
        { onboardingCompleted: true, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch {
      // non-critical
    }
  };

  return { showOnboarding, checked, completeOnboarding };
}
