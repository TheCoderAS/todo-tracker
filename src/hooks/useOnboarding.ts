import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { db } from "@/lib/firebase";

const ONBOARDING_STORAGE_KEY = "onboardingCompleted";

export function useOnboarding(user: User | null) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) {
      setChecked(true);
      return;
    }

    if (localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true") {
      setChecked(true);
      return;
    }

    let cancelled = false;
    const check = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "settings", "preferences"));
        if (cancelled) return;
        const data = snap.data();
        if (data?.onboardingCompleted) {
          localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
        } else {
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
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    if (!user) return;
    try {
      await setDoc(
        doc(db, "users", user.uid, "settings", "preferences"),
        { onboardingCompleted: true, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch {
      // non-critical — localStorage fallback already set
    }
  };

  return { showOnboarding, checked, completeOnboarding };
}
