import { useCallback, useState } from "react";
import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  getDateKey,
  getHabitMilestoneProgress,
  getLocalTimeZone,
  isHabitScheduledForDate
} from "@/lib/habitUtils";
import type { Habit, HabitFrequency, HabitInput } from "@/lib/types";
import type { SnackbarVariant } from "@/components/ui/Snackbar";
import { normalizeTitle } from "@/hooks/todos/useTodoFormState";

type SnackbarState = {
  message: string;
  variant: SnackbarVariant;
  onUndo?: () => void;
} | null;

const formatTimeValue = (date: Date) => {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
};

const getDefaultReminderDays = (frequency: HabitFrequency) => {
  const today = new Date();
  if (frequency === "weekly") return [today.getDay()];
  if (frequency === "daily") return [0, 1, 2, 3, 4, 5, 6];
  if (frequency === "yearly") return [today.getMonth() + 1, today.getDate()];
  return [today.getDate()];
};

type UseHabitActionsOptions = {
  user: User | null;
  habits: Habit[];
  setSnackbar: (state: SnackbarState) => void;
};

export function useHabitActions({ user, habits, setSnackbar }: UseHabitActionsOptions) {
  const [habitForm, setHabitForm] = useState<HabitInput>({
    title: "",
    habitType: "positive",
    reminderTime: "",
    reminderDays: getDefaultReminderDays("daily"),
    frequency: "daily",
    graceMisses: 0,
    contextTags: [],
    triggerAfterHabitId: null
  });
  const [graceMissesInput, setGraceMissesInput] = useState("0");
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [confirmHabitDelete, setConfirmHabitDelete] = useState<Habit | null>(null);
  const [linkedHabitPrompt, setLinkedHabitPrompt] = useState<{
    source: Habit;
    target: Habit;
  } | null>(null);

  const resetHabitForm = useCallback(() => {
    const now = new Date();
    setHabitForm({
      title: "",
      habitType: "positive",
      reminderTime: formatTimeValue(now),
      reminderDays: getDefaultReminderDays("daily"),
      frequency: "daily",
      graceMisses: 0,
      contextTags: [],
      triggerAfterHabitId: null
    });
    setGraceMissesInput("0");
    setEditingHabitId(null);
  }, []);

  const openHabitModal = useCallback(() => {
    resetHabitForm();
    setIsHabitFormOpen(true);
  }, [resetHabitForm]);

  const closeHabitModal = useCallback(() => {
    resetHabitForm();
    setIsHabitFormOpen(false);
  }, [resetHabitForm]);

  const handleHabitFormChange = useCallback(
    (
      event:
        | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
        | { target: { name: string; value: string[] } }
    ) => {
      const { name, value } = event.target;
      if (name === "contextTags" && Array.isArray(value)) {
        setHabitForm((prev) => ({ ...prev, contextTags: value }));
        return;
      }
      if (name === "triggerAfterHabitId") {
        setHabitForm((prev) => ({
          ...prev,
          triggerAfterHabitId: value ? (value as string) : null
        }));
        return;
      }
      if (name === "frequency") {
        const nextFrequency = value as HabitFrequency;
        setHabitForm((prev) => ({
          ...prev,
          frequency: nextFrequency,
          reminderDays: getDefaultReminderDays(nextFrequency)
        }));
        return;
      }
      let nextValue = value as string;
      if (name === "title") {
        nextValue = (value as string).slice(0, 40);
      }
      setHabitForm((prev) => ({ ...prev, [name]: nextValue }));
    },
    []
  );

  const handleGraceMissesChange = useCallback((value: string) => {
    setGraceMissesInput(value);
    if (!value.trim()) return;
    const nextNumber = Number.parseInt(value, 10);
    if (Number.isNaN(nextNumber)) return;
    setHabitForm((prev) => ({
      ...prev,
      graceMisses: Math.min(7, Math.max(0, nextNumber))
    }));
  }, []);

  const handleGraceMissesBlur = useCallback(() => {
    setGraceMissesInput((prev) => {
      if (!prev.trim()) {
        setHabitForm((f) => ({ ...f, graceMisses: 0 }));
        return "0";
      }
      const nextNumber = Number.parseInt(prev, 10);
      const normalized = Number.isNaN(nextNumber)
        ? 0
        : Math.min(7, Math.max(0, nextNumber));
      setHabitForm((f) => ({ ...f, graceMisses: normalized }));
      return String(normalized);
    });
  }, []);

  const handleHabitDayToggle = useCallback((dayIndex: number) => {
    setHabitForm((prev) => {
      const hasDay = prev.reminderDays.includes(dayIndex);
      const nextDays = hasDay
        ? prev.reminderDays.filter((day) => day !== dayIndex)
        : [...prev.reminderDays, dayIndex];
      return { ...prev, reminderDays: nextDays.length ? nextDays : prev.reminderDays };
    });
  }, []);

  const handleHabitDayOfMonthChange = useCallback((dayOfMonth: number) => {
    setHabitForm((prev) => ({
      ...prev,
      reminderDays:
        prev.frequency === "yearly"
          ? [
              prev.reminderDays.length >= 2
                ? prev.reminderDays[0]
                : new Date().getMonth() + 1,
              dayOfMonth
            ]
          : [dayOfMonth]
    }));
  }, []);

  const handleHabitMonthChange = useCallback((month: number) => {
    setHabitForm((prev) => ({
      ...prev,
      reminderDays: [
        month,
        prev.reminderDays[1] ?? prev.reminderDays[0] ?? new Date().getDate()
      ]
    }));
  }, []);

  const handleSubmitHabit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const normalizedHabitTitle = normalizeTitle(habitForm.title);
      if (!normalizedHabitTitle) {
        setSnackbar({ message: "Add a habit title to continue.", variant: "error" });
        return;
      }
      if (!habitForm.reminderTime.trim()) {
        setSnackbar({ message: "Choose a reminder time.", variant: "error" });
        return;
      }
      if (!user) {
        setSnackbar({ message: "Sign in to manage habits.", variant: "error" });
        return;
      }
      setActionLoading(true);
      try {
        if (editingHabitId) {
          await updateDoc(doc(db, "users", user.uid, "habits", editingHabitId), {
            title: normalizedHabitTitle,
            habitType: habitForm.habitType,
            reminderTime: habitForm.reminderTime,
            reminderDays: habitForm.reminderDays,
            frequency: habitForm.frequency,
            graceMisses: habitForm.graceMisses,
            contextTags: habitForm.contextTags,
            triggerAfterHabitId: habitForm.triggerAfterHabitId ?? null,
            updatedAt: serverTimestamp()
          });
          setSnackbar({ message: "Habit updated.", variant: "success" });
        } else {
          await addDoc(collection(db, "users", user.uid, "habits"), {
            title: normalizedHabitTitle,
            habitType: habitForm.habitType,
            reminderTime: habitForm.reminderTime,
            reminderDays: habitForm.reminderDays,
            frequency: habitForm.frequency,
            graceMisses: habitForm.graceMisses,
            contextTags: habitForm.contextTags,
            triggerAfterHabitId: habitForm.triggerAfterHabitId ?? null,
            completionDates: [],
            skippedDates: [],
            timezone: getLocalTimeZone(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            author_uid: user.uid,
            lastNotifiedDate: null,
            lastLevelNotified: 0,
            archivedAt: null
          });
          setSnackbar({ message: "Habit added to your list.", variant: "success" });
        }
        closeHabitModal();
      } catch (error) {
        console.error(error);
        setSnackbar({ message: "Unable to save habit.", variant: "error" });
      } finally {
        setActionLoading(false);
      }
    },
    [user, habitForm, editingHabitId, setSnackbar, closeHabitModal]
  );

  const handleToggleHabitCompletion = useCallback(
    async (habit: Habit) => {
      if (!user) {
        setSnackbar({ message: "Sign in to update habits.", variant: "error" });
        return;
      }
      if (habit.archivedAt) {
        setSnackbar({ message: "Restore the habit to update it.", variant: "error" });
        return;
      }
      const todayKey = getDateKey(new Date(), habit.timezone);
      const completionDates = habit.completionDates ?? [];
      const skippedDates = habit.skippedDates ?? [];
      const isCompleted = completionDates.includes(todayKey);
      const nextDates = isCompleted
        ? completionDates.filter((date) => date !== todayKey)
        : [...completionDates, todayKey];
      const nextSkippedDates = isCompleted
        ? skippedDates
        : skippedDates.filter((date) => date !== todayKey);
      const milestoneProgress = getHabitMilestoneProgress(nextDates.length);
      const lastNotifiedLevel = habit.lastLevelNotified ?? 0;
      const shouldCelebrate = !isCompleted && milestoneProgress.level > lastNotifiedLevel;
      setActionLoading(true);
      try {
        await updateDoc(doc(db, "users", user.uid, "habits", habit.id), {
          completionDates: nextDates,
          skippedDates: nextSkippedDates,
          updatedAt: serverTimestamp(),
          ...(shouldCelebrate ? { lastLevelNotified: milestoneProgress.level } : {})
        });
        setSnackbar({
          message: isCompleted
            ? "Habit reset for today."
            : shouldCelebrate
            ? `Level up! You're now level ${milestoneProgress.level}.`
            : "Nice work! Habit completed.",
          variant: "success"
        });
        if (!isCompleted && habit.triggerAfterHabitId) {
          const linkedHabit = habits.find(
            (item) => item.id === habit.triggerAfterHabitId && !item.archivedAt
          );
          if (linkedHabit) {
            setLinkedHabitPrompt({ source: habit, target: linkedHabit });
          }
        }
      } catch (error) {
        console.error(error);
        setSnackbar({ message: "Unable to update habit.", variant: "error" });
      } finally {
        setActionLoading(false);
      }
    },
    [user, habits, setSnackbar]
  );

  const handleRescheduleHabit = useCallback(
    async (habit: Habit, dateKey: string) => {
      if (!user) {
        setSnackbar({ message: "Sign in to update habits.", variant: "error" });
        return;
      }
      if (habit.archivedAt) {
        setSnackbar({ message: "Restore the habit to update it.", variant: "error" });
        return;
      }
      const completionDates = habit.completionDates ?? [];
      const skippedDates = habit.skippedDates ?? [];
      const nextCompletionDates = completionDates.includes(dateKey)
        ? completionDates
        : [...completionDates, dateKey];
      const nextSkippedDates = skippedDates.filter((date) => date !== dateKey);
      const milestoneProgress = getHabitMilestoneProgress(nextCompletionDates.length);
      const lastNotifiedLevel = habit.lastLevelNotified ?? 0;
      const shouldCelebrate =
        !completionDates.includes(dateKey) && milestoneProgress.level > lastNotifiedLevel;
      setActionLoading(true);
      try {
        await updateDoc(doc(db, "users", user.uid, "habits", habit.id), {
          completionDates: nextCompletionDates,
          skippedDates: nextSkippedDates,
          updatedAt: serverTimestamp(),
          ...(shouldCelebrate ? { lastLevelNotified: milestoneProgress.level } : {})
        });
        setSnackbar({
          message: shouldCelebrate
            ? `Level up! You're now level ${milestoneProgress.level}.`
            : "Habit session marked as rescheduled.",
          variant: "success"
        });
      } catch (error) {
        console.error(error);
        setSnackbar({ message: "Unable to reschedule habit session.", variant: "error" });
      } finally {
        setActionLoading(false);
      }
    },
    [user, setSnackbar]
  );

  const handleSkipHabit = useCallback(
    async (habit: Habit, dateKey: string) => {
      if (!user) {
        setSnackbar({ message: "Sign in to update habits.", variant: "error" });
        return;
      }
      if (habit.archivedAt) {
        setSnackbar({ message: "Restore the habit to update it.", variant: "error" });
        return;
      }
      const skippedDates = habit.skippedDates ?? [];
      const completionDates = habit.completionDates ?? [];
      const nextSkippedDates = skippedDates.includes(dateKey)
        ? skippedDates
        : [...skippedDates, dateKey];
      setActionLoading(true);
      try {
        await updateDoc(doc(db, "users", user.uid, "habits", habit.id), {
          completionDates: completionDates.filter((date) => date !== dateKey),
          skippedDates: nextSkippedDates,
          updatedAt: serverTimestamp()
        });
        setSnackbar({ message: "Habit session marked as skipped.", variant: "info" });
      } catch (error) {
        console.error(error);
        setSnackbar({ message: "Unable to skip habit session.", variant: "error" });
      } finally {
        setActionLoading(false);
      }
    },
    [user, setSnackbar]
  );

  const handleArchiveHabit = useCallback(
    async (habit: Habit) => {
      if (!user) {
        setSnackbar({ message: "Sign in to update habits.", variant: "error" });
        return;
      }
      setActionLoading(true);
      try {
        await updateDoc(doc(db, "users", user.uid, "habits", habit.id), {
          archivedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setSnackbar({ message: "Habit archived.", variant: "info" });
      } catch (error) {
        console.error(error);
        setSnackbar({ message: "Unable to archive habit.", variant: "error" });
      } finally {
        setActionLoading(false);
      }
    },
    [user, setSnackbar]
  );

  const handleEditHabit = useCallback(
    (habit: Habit) => {
      setEditingHabitId(habit.id);
      setHabitForm({
        title: habit.title,
        habitType: habit.habitType ?? "positive",
        reminderTime: habit.reminderTime,
        reminderDays: habit.reminderDays?.length
          ? habit.reminderDays
          : getDefaultReminderDays(habit.frequency),
        frequency: habit.frequency,
        graceMisses: habit.graceMisses ?? 0,
        contextTags: habit.contextTags ?? [],
        triggerAfterHabitId: habit.triggerAfterHabitId ?? null
      });
      setGraceMissesInput(String(habit.graceMisses ?? 0));
      setIsHabitFormOpen(true);
    },
    []
  );

  const handleDeleteHabitRequest = useCallback((habit: Habit) => {
    setConfirmHabitDelete(habit);
  }, []);

  const handleDeleteHabit = useCallback(
    async (habit: Habit) => {
      if (!user) return;
      setActionLoading(true);
      try {
        if (habit.archivedAt) {
          await deleteDoc(doc(db, "users", user.uid, "habits", habit.id));
          setSnackbar({ message: "Habit deleted.", variant: "info" });
        } else {
          await updateDoc(doc(db, "users", user.uid, "habits", habit.id), {
            archivedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          setSnackbar({ message: "Habit archived.", variant: "info" });
        }
      } catch (error) {
        console.error(error);
        setSnackbar({ message: "Unable to delete habit.", variant: "error" });
      } finally {
        setActionLoading(false);
      }
    },
    [user, setSnackbar]
  );

  const dismissLinkedHabitPrompt = useCallback(() => {
    setLinkedHabitPrompt(null);
  }, []);

  return {
    habitForm,
    graceMissesInput,
    editingHabitId,
    isHabitFormOpen,
    habitActionLoading: actionLoading,
    selectedHabit,
    confirmHabitDelete,
    linkedHabitPrompt,
    setSelectedHabit,
    setConfirmHabitDelete,
    dismissLinkedHabitPrompt,
    openHabitModal,
    closeHabitModal,
    handleHabitFormChange,
    handleGraceMissesChange,
    handleGraceMissesBlur,
    handleHabitDayToggle,
    handleHabitDayOfMonthChange,
    handleHabitMonthChange,
    handleSubmitHabit,
    handleToggleHabitCompletion,
    handleRescheduleHabit,
    handleSkipHabit,
    handleArchiveHabit,
    handleEditHabit,
    handleDeleteHabitRequest,
    handleDeleteHabit
  };
}
