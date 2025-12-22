"use client";

import { useEffect, useMemo, useState } from "react";
import { sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { useAuth } from "@/components/auth/AuthProvider";
import OverlayLoader from "@/components/ui/OverlayLoader";
import Snackbar, { type SnackbarVariant } from "@/components/ui/Snackbar";
import { auth, db } from "@/lib/firebase";

type ProfileFormState = {
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
};

const defaultProfile: ProfileFormState = {
  firstName: "",
  lastName: "",
  phone: "",
  gender: ""
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState<ProfileFormState>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    variant: SnackbarVariant;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        if (!isMounted) return;
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<ProfileFormState>;
          setForm({
            firstName: data.firstName ?? "",
            lastName: data.lastName ?? "",
            phone: data.phone ?? "",
            gender: data.gender ?? ""
          });
        } else {
          setForm(defaultProfile);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setForm(defaultProfile);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const displayName = useMemo(() => {
    if (!user) return "Profile";
    if (form.firstName || form.lastName) {
      return [form.firstName, form.lastName].filter(Boolean).join(" ");
    }
    return user.displayName ?? user.email ?? "Profile";
  }, [form.firstName, form.lastName, user]);

  const initials = useMemo(() => {
    const parts = displayName.split(" ").filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  }, [displayName]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const nextDisplayName = [form.firstName, form.lastName].filter(Boolean).join(" ");
      if (auth.currentUser && nextDisplayName && nextDisplayName !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName: nextDisplayName });
      }
      await setDoc(
        doc(db, "users", user.uid),
        {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          gender: form.gender,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      setSnackbar({ message: "Profile updated.", variant: "success" });
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to update profile.", variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) {
      setSnackbar({ message: "No email found for this account.", variant: "error" });
      return;
    }
    setIsSaving(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setSnackbar({ message: "Password reset email sent.", variant: "success" });
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to send reset email.", variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <section className="relative z-10 flex min-h-[60vh] items-center justify-center">
        <OverlayLoader />
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/60">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/60 text-lg font-semibold text-slate-100">
            {initials || "AP"}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Profile</p>
            <h2 className="text-xl font-semibold text-white">{displayName}</h2>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>
      </div>

      <form
        className="grid gap-4 rounded-3xl border border-slate-900/60 bg-slate-950/70 p-6"
        onSubmit={handleSave}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold capitalize tracking-[0.05em] text-slate-300">
              First name
            </span>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold capitalize tracking-[0.05em] text-slate-300">
              Last name
            </span>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold capitalize tracking-[0.05em] text-slate-300">
              Phone
            </span>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold capitalize tracking-[0.05em] text-slate-300">
              Gender
            </span>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
            >
              <option value="">Select</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-full bg-sky-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            disabled={isSaving}
          >
            Save profile
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-slate-700/70 px-5 py-2 text-sm font-semibold text-slate-200"
            onClick={handleResetPassword}
            disabled={isSaving}
          >
            Reset password
          </button>
        </div>
      </form>
      {isSaving ? <OverlayLoader /> : null}
      {snackbar ? (
        <Snackbar
          message={snackbar.message}
          variant={snackbar.variant}
          onDismiss={() => setSnackbar(null)}
        />
      ) : null}
    </section>
  );
}
