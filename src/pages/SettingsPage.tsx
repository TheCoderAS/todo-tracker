import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { sendPasswordResetEmail, updateProfile } from "firebase/auth";
import {
  FiBell,
  FiCalendar,
  FiDownload,
  FiEdit2,
  FiHelpCircle,
  FiInfo,
  FiLock,
  FiMoon,
  FiSun
} from "react-icons/fi";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { useAuth } from "@/components/auth/AuthProvider";
import OverlayLoader from "@/components/ui/OverlayLoader";
import Snackbar, { type SnackbarVariant } from "@/components/ui/Snackbar";
import SettingCard from "@/components/settings/SettingCard";
import ToggleSwitch from "@/components/settings/ToggleSwitch";
import ProfileModal, {
  type ProfileFormState
} from "@/components/settings/ProfileModal";
import AboutModal from "@/components/settings/AboutModal";
import FaqModal from "@/components/settings/FaqModal";
import { auth, db } from "@/lib/firebase";
import { useSearchData } from "@/hooks/useSearchData";
import { useDataExport } from "@/hooks/useDataExport";
import appMeta from "../../package.json";

const THEME_STORAGE_KEY = "theme";
const NOTIFICATIONS_STORAGE_KEY = "notificationsEnabled";

const defaultProfile: ProfileFormState = {
  firstName: "",
  lastName: "",
  phone: "",
  gender: ""
};

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
  const { todos, habits } = useSearchData(user);
  const { exportJSON, exportCSV, exportICS } = useDataExport(todos, habits);
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
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [displayName]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (event: FormEvent) => {
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

  const handleExportJSON = () => {
    exportJSON();
    setSnackbar({ message: "Data exported as JSON.", variant: "success" });
  };

  const handleExportCSV = () => {
    exportCSV();
    setSnackbar({ message: "Data exported as CSV.", variant: "success" });
  };

  const handleExportICS = () => {
    exportICS();
    setSnackbar({
      message: "Calendar file exported. Import it into your calendar app.",
      variant: "success"
    });
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
        <SettingCard
          icon={<FiLock aria-hidden />}
          title="Reset password"
          description="Send a secure password reset link to your email address."
          action={
            <button
              type="button"
              onClick={handleResetPassword}
              className="rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold uppercase text-slate-300 transition hover:border-slate-500/80 hover:text-white"
              disabled={isSaving}
            >
              Send link
            </button>
          }
        />

        <SettingCard
          icon={theme === "light" ? <FiSun aria-hidden /> : <FiMoon aria-hidden />}
          title="Theme"
          description="Switch between a dark or light visual experience."
          action={
            <ToggleSwitch
              checked={theme === "light"}
              ariaLabel="Toggle light theme"
              onChange={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
              onLabel="☀"
              offLabel="☾"
            />
          }
        />

        <SettingCard
          icon={<FiBell aria-hidden />}
          title="Notifications"
          description="Allow or pause reminders, summaries, and updates."
          action={
            <ToggleSwitch
              checked={notificationsEnabled}
              ariaLabel="Toggle notifications"
              onChange={() => setNotificationsEnabled((prev) => !prev)}
            />
          }
        />

        <SettingCard
          icon={<FiDownload aria-hidden />}
          title="Data export"
          description="Download your todos and habits, or export scheduled tasks to your calendar."
        >
          <div className="mt-3 flex flex-wrap gap-3 pl-14">
            <button
              type="button"
              onClick={handleExportJSON}
              className="flex items-center gap-2 rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold uppercase text-slate-300 transition hover:border-slate-500/80 hover:text-white"
            >
              <FiDownload aria-hidden />
              Export JSON
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-2 rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold uppercase text-slate-300 transition hover:border-slate-500/80 hover:text-white"
            >
              <FiDownload aria-hidden />
              Export CSV
            </button>
            <button
              type="button"
              onClick={handleExportICS}
              className="flex items-center gap-2 rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold uppercase text-slate-300 transition hover:border-slate-500/80 hover:text-white"
            >
              <FiCalendar aria-hidden />
              Calendar (.ics)
            </button>
          </div>
        </SettingCard>

        <div className="grid gap-3 lg:grid-cols-2">
          <SettingCard
            icon={<FiInfo aria-hidden />}
            title="About Aura Pulse"
            description="Read the app vision, version details, and team info."
            action={
              <button
                type="button"
                onClick={() => setIsAboutOpen(true)}
                className="rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold uppercase text-slate-300 transition hover:border-slate-500/80 hover:text-white"
              >
                View
              </button>
            }
          />
          <SettingCard
            icon={<FiHelpCircle aria-hidden />}
            title="FAQs"
            description="Step-by-step guidance for each feature and common concerns."
            action={
              <button
                type="button"
                onClick={() => setIsFaqOpen(true)}
                className="rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold uppercase text-slate-300 transition hover:border-slate-500/80 hover:text-white"
              >
                Explore
              </button>
            }
          />
        </div>
      </div>

      <ProfileModal
        isOpen={isProfileModalOpen}
        form={form}
        isSaving={isSaving}
        onClose={() => setIsProfileModalOpen(false)}
        onChange={handleChange}
        onSubmit={handleSave}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        appName={appMeta.name}
        appVersion={appMeta.version}
      />

      <FaqModal isOpen={isFaqOpen} onClose={() => setIsFaqOpen(false)} />

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
