import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { sendPasswordResetEmail, updateProfile } from "firebase/auth";
import {
  FiBell,
  FiEdit2,
  FiHelpCircle,
  FiInfo,
  FiLock,
  FiMoon,
  FiSave,
  FiSun,
  FiX
} from "react-icons/fi";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import Modal from "@/components/ui/Modal";
import { useAuth } from "@/components/auth/AuthProvider";
import OverlayLoader from "@/components/ui/OverlayLoader";
import Snackbar, { type SnackbarVariant } from "@/components/ui/Snackbar";
import { auth, db } from "@/lib/firebase";
import appMeta from "../../package.json";

const THEME_STORAGE_KEY = "theme";
const NOTIFICATIONS_STORAGE_KEY = "notificationsEnabled";

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
  "w-full rounded-2xl border border-slate-800/70 bg-slate-950/55 px-3.5 py-2.5 text-sm text-slate-100 shadow-sm transition-colors duration-200 ease-out focus:border-emerald-300/60 focus:bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-emerald-300/15";

const labelClasses = "flex flex-col gap-1.5";
const labelTextClasses = "text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400";

const deriveNameParts = (displayName?: string | null) => {
  const parts = displayName?.trim().split(/\s+/).filter(Boolean) ?? [];
  const [firstName = "", ...rest] = parts;
  return { firstName, lastName: rest.join(" ") };
};

const readStoredTheme = () => {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(THEME_STORAGE_KEY) || "dark";
};

const readNotificationPreference = () => {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  if (stored === null) return true;
  return stored === "true";
};

export default function SettingsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState<ProfileFormState>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [theme, setTheme] = useState(() => readStoredTheme());
  const [notificationsEnabled, setNotificationsEnabled] = useState(() =>
    readNotificationPreference()
  );
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
  }, [location.pathname, user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("theme-light");
    } else {
      root.classList.remove("theme-light");
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    window.dispatchEvent(new Event("theme-preference"));
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, String(notificationsEnabled));
    window.dispatchEvent(new Event("notifications-preference"));
  }, [notificationsEnabled]);

  const displayName = useMemo(() => {
    if (!user) return "Settings";
    if (form.firstName || form.lastName) {
      return [form.firstName, form.lastName].filter(Boolean).join(" ");
    }
    return user.displayName ?? user.email ?? "Settings";
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
      setIsProfileModalOpen(false);
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
    <section className="grid gap-4">
      <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-5 shadow-2xl shadow-slate-950/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/60 text-lg font-semibold text-slate-100">
              {initials || "AP"}
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Settings</p>
              <h2 className="text-xl font-semibold text-white">{displayName}</h2>
              <p className="text-sm text-slate-400">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold uppercase text-slate-300 transition hover:border-slate-500/80 hover:text-white"
            onClick={() => setIsProfileModalOpen(true)}
          >
            <FiEdit2 className="h-4 w-4" />
            Edit profile
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-2 text-slate-300">
                <FiLock aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Reset password</p>
                <p className="text-xs text-slate-400">
                  Send a secure password reset link to your email address.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetPassword}
              className="rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold uppercase text-slate-300 transition hover:border-slate-500/80 hover:text-white"
              disabled={isSaving}
            >
              Send link
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-2 text-slate-300">
                {theme === "light" ? <FiSun aria-hidden /> : <FiMoon aria-hidden />}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Theme</p>
                <p className="text-xs text-slate-400">
                  Switch between a dark or light visual experience.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={theme === "light"}
              onClick={() =>
                setTheme((prev) => (prev === "light" ? "dark" : "light"))
              }
              className={`relative flex h-8 w-16 items-center rounded-full border transition ${
                theme === "light"
                  ? "border-emerald-400/70 bg-emerald-400/20"
                  : "border-slate-700/70 bg-slate-900/60"
              }`}
            >
              <span
                className={`absolute left-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  theme === "light"
                    ? "translate-x-8 bg-emerald-400 text-slate-950"
                    : "translate-x-0 bg-slate-700 text-slate-200"
                }`}
              >
                {theme === "light" ? "☀" : "☾"}
              </span>
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-2 text-slate-300">
                <FiBell aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Notifications</p>
                <p className="text-xs text-slate-400">
                  Allow or pause reminders, summaries, and updates.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notificationsEnabled}
              onClick={() => setNotificationsEnabled((prev) => !prev)}
              className={`relative flex h-8 w-16 items-center rounded-full border transition ${
                notificationsEnabled
                  ? "border-emerald-400/70 bg-emerald-400/20"
                  : "border-slate-700/70 bg-slate-900/60"
              }`}
            >
              <span
                className={`absolute left-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  notificationsEnabled
                    ? "translate-x-8 bg-emerald-400 text-slate-950"
                    : "translate-x-0 bg-slate-700 text-slate-200"
                }`}
              >
                {notificationsEnabled ? "On" : "Off"}
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-2 text-slate-300">
                  <FiInfo aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">About Aura Pulse</p>
                  <p className="text-xs text-slate-400">
                    Read the app vision, version details, and team info.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAboutOpen(true)}
                className="rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold uppercase text-slate-300 transition hover:border-slate-500/80 hover:text-white"
              >
                View
              </button>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-2 text-slate-300">
                  <FiHelpCircle aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">FAQs</p>
                  <p className="text-xs text-slate-400">
                    Step-by-step guidance for each feature and common concerns.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFaqOpen(true)}
                className="rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold uppercase text-slate-300 transition hover:border-slate-500/80 hover:text-white"
              >
                Explore
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        ariaLabel="Edit profile"
      >
        <form className="grid gap-5" onSubmit={handleSave}>
          <div className="modal-header flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Update profile</h3>
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="rounded-full border border-slate-700/70 px-3 py-2 text-xs font-semibold uppercase text-slate-300 transition hover:border-slate-500/80 hover:text-white"
            >
              <FiX />
            </button>
          </div>
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
          <div className="grid gap-2 sm:grid-cols-2">
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
              onClick={() => setIsProfileModalOpen(false)}
              disabled={isSaving}
            >
              <FiX aria-hidden />
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} ariaLabel="About">
        <div className="grid gap-4">
          <div className="modal-header flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">About Aura Pulse</h3>
            <button
              type="button"
              onClick={() => setIsAboutOpen(false)}
              className="rounded-full border border-slate-700/70 px-3 py-2 text-xs font-semibold uppercase text-slate-300 transition hover:border-slate-500/80 hover:text-white"
            >
              <FiX />
            </button>
          </div>
          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4">
            <p className="text-xs uppercase text-slate-400">Version</p>
            <p className="text-sm text-slate-100">{appMeta.name} v{appMeta.version}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4">
              <p className="text-xs uppercase text-slate-400">Developer</p>
              <p className="text-sm text-slate-100">Aura Pulse Studio</p>
              <p className="text-xs text-slate-500">hello@aurapulse.app</p>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4">
              <p className="text-xs uppercase text-slate-400">App details</p>
              <p className="text-sm text-slate-100">
                Daily planning, habit building, routines, focus sessions, and review workflows.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4">
            <p className="text-xs uppercase text-slate-400">Vision & mission</p>
            <p className="text-sm text-slate-100">
              Empower people to build calm, consistent momentum through intentional planning,
              mindful habits, and clear daily focus. Aura Pulse exists to make progress feel
              lighter, clearer, and repeatable.
            </p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isFaqOpen} onClose={() => setIsFaqOpen(false)} ariaLabel="FAQs">
        <div className="grid gap-4">
          <div className="modal-header flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">FAQs & how-to guide</h3>
            <button
              type="button"
              onClick={() => setIsFaqOpen(false)}
              className="rounded-full border border-slate-700/70 px-3 py-2 text-xs font-semibold uppercase text-slate-300 transition hover:border-slate-500/80 hover:text-white"
            >
              <FiX />
            </button>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4">
              <h4 className="text-sm font-semibold text-white">Tasks (Todos)</h4>
              <p className="mt-2 text-xs text-slate-400">
                Create focused tasks and organize them so they surface in your daily plan.
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-200">
                <li>Open the Tasks tab and tap the + button to add a new todo.</li>
                <li>Give it a clear title, then pick a date and time for scheduling.</li>
                <li>Set priority, tags, and context tags to help with filtering later.</li>
                <li>Expand the description editor to add notes or links.</li>
                <li>Save to place the task into your daily plan or review list.</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4">
              <h4 className="text-sm font-semibold text-white">Habits</h4>
              <p className="mt-2 text-xs text-slate-400">
                Build consistency by scheduling habits and tracking streaks.
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-200">
                <li>Switch to the Habits tab and tap the + button to create one.</li>
                <li>Name the habit, select positive or negative, and choose frequency.</li>
                <li>Pick reminder days and a time so it shows up in your daily list.</li>
                <li>Add context tags to group similar routines or focus themes.</li>
                <li>Save, then tap the habit each day to log your progress.</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4">
              <h4 className="text-sm font-semibold text-white">Routines</h4>
              <p className="mt-2 text-xs text-slate-400">
                Save repeatable sequences so you can launch them in one tap.
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-200">
                <li>Open Routines and choose “Add routine” from the toolbar.</li>
                <li>Add each step as a template task with tags and descriptions.</li>
                <li>Save the routine, then run it to add tasks to today’s plan.</li>
                <li>Open the routine list anytime to update or delete steps.</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4">
              <h4 className="text-sm font-semibold text-white">Focus sessions</h4>
              <p className="mt-2 text-xs text-slate-400">
                Use focus mode to stay on track and measure your momentum.
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-200">
                <li>Open the Focus panel from the dashboard or the Focus tab.</li>
                <li>Select the tasks and habits you want to prioritize today.</li>
                <li>Start the session and work through items one at a time.</li>
                <li>End the session to review completion rates and insights.</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4">
              <h4 className="text-sm font-semibold text-white">Dashboard insights</h4>
              <p className="mt-2 text-xs text-slate-400">
                Read trends and completion cues so you can adjust your plan.
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-200">
                <li>Check the daily stats card for tasks and habit streaks.</li>
                <li>Scan the weekly trend cards to see completion patterns.</li>
                <li>Use review alerts to reschedule or archive missed items.</li>
                <li>Return to the dashboard after updates to confirm progress.</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4">
              <h4 className="text-sm font-semibold text-white">Common concerns</h4>
              <p className="mt-2 text-xs text-slate-400">
                Quick fixes for the most frequent setup questions.
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-200">
                <li>Open Settings to confirm notifications are turned on.</li>
                <li>Check device notification permissions if alerts feel quiet.</li>
                <li>Use context tags to filter habits and tasks faster.</li>
                <li>Reset your password from Settings if you forget it.</li>
              </ol>
            </div>
          </div>
        </div>
      </Modal>

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
