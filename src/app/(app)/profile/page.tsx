"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { FiEdit2, FiSave, FiX } from "react-icons/fi";
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

const inputClasses =
  "w-full rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 transition focus:border-emerald-400/70 focus:outline-none focus:ring-1 focus:ring-emerald-400/40";

const labelClasses = "flex flex-col gap-2";
const labelTextClasses = "text-xs font-semibold capitalize text-slate-300";

const deriveNameParts = (displayName?: string | null) => {
  const parts = displayName?.trim().split(/\s+/).filter(Boolean) ?? [];
  const [firstName = "", ...rest] = parts;
  return { firstName, lastName: rest.join(" ") };
};

export default function ProfilePage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [form, setForm] = useState<ProfileFormState>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    variant: SnackbarVariant;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    setIsLoading(true);
    const fetchProfile = async () => {
      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        if (!isMounted) return;
        const derivedName = deriveNameParts(user.displayName);
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<ProfileFormState>;
          setForm({
            firstName: data.firstName ?? derivedName.firstName,
            lastName: data.lastName ?? derivedName.lastName,
            phone: data.phone ?? "",
            gender: data.gender ?? ""
          });
        } else {
          setForm({ ...defaultProfile, ...derivedName });
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
  }, [pathname, user]);

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
          author_uid: user.uid,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      setSnackbar({ message: "Profile updated.", variant: "success" });
      setIsEditing(false);
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/60 text-lg font-semibold text-slate-100">
              {initials || "AP"}
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">
                Profile
              </p>
              <h2 className="text-xl font-semibold text-white">{displayName}</h2>
              <p className="text-sm text-slate-400">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700/70 text-slate-200 transition hover:border-slate-500"
            onClick={() => setIsEditing((prev) => !prev)}
            aria-label={isEditing ? "Close profile editor" : "Edit profile"}
          >
            {isEditing ? <FiX className="h-4 w-4" /> : <FiEdit2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isEditing ? (
        <form
          className="grid gap-5 rounded-3xl border border-slate-900/60 bg-slate-950/70 p-6"
          onSubmit={handleSave}
        >
          <h3 className="text-lg font-semibold text-white">Update profile</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClasses}>
              <span className={labelTextClasses}>First name</span>
              <input
                name="firstName"
                placeholder="Jane"
                value={form.firstName}
                onChange={handleChange}
                className={inputClasses}
              />
            </label>
            <label className={labelClasses}>
              <span className={labelTextClasses}>Last name</span>
              <input
                name="lastName"
                placeholder="Doe"
                value={form.lastName}
                onChange={handleChange}
                className={inputClasses}
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClasses}>
              <span className={labelTextClasses}>Phone</span>
              <input
                name="phone"
                placeholder="+1 (555) 123-4567"
                value={form.phone}
                onChange={handleChange}
                className={inputClasses}
              />
            </label>
            <label className={labelClasses}>
              <span className={labelTextClasses}>Gender</span>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className={inputClasses}
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
          <div className="sticky bottom-0 -mx-6 mt-4 grid gap-2 border-t border-slate-900/60 bg-slate-950/80 px-6 py-4 backdrop-blur sm:grid-cols-2">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.45)] transition hover:bg-emerald-300 active:scale-[0.98]"
              disabled={isSaving}
            >
              <FiSave aria-hidden />
              Save profile
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-700/70 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500/80 hover:text-white active:scale-[0.98]"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              <FiX aria-hidden />
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      {isEditing ? (
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-700/70 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500/80 hover:text-white active:scale-[0.98]"
          onClick={handleResetPassword}
          disabled={isSaving}
        >
          Reset password
        </button>
      ) : null}
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
