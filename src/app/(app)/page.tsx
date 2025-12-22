"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/firebase";

type ProfileData = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        if (!isMounted) return;
        setProfile(snapshot.exists() ? (snapshot.data() as ProfileData) : null);
      } catch (error) {
        if (!isMounted) return;
        console.error(error);
        setProfile(null);
      }
    };
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const displayName = useMemo(() => {
    if (profile?.firstName || profile?.lastName) {
      return [profile.firstName, profile.lastName].filter(Boolean).join(" ");
    }
    if (user?.displayName) return user.displayName;
    return user?.email ?? "Profile";
  }, [profile, user]);

  const initials = useMemo(() => {
    if (!displayName) return "AP";
    const parts = displayName.split(" ").filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  }, [displayName]);

  return (
    <section className="grid gap-6">
      <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/60">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/60 text-lg font-semibold text-slate-100">
            {initials}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Profile</p>
            <h2 className="text-xl font-semibold text-white">{displayName}</h2>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Focus</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Today looks clear.</h3>
          <p className="mt-2 text-sm text-slate-400">
            Jump into your todos to plan the next steps.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Quick Access</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Review your tasks.</h3>
          <p className="mt-2 text-sm text-slate-400">
            Use the bottom bar to switch to the Todos view.
          </p>
        </div>
      </div>
    </section>
  );
}
