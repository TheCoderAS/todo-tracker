import { useCallback, useState } from "react";
import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getDateKey, getLocalTimeZone } from "@/lib/habitUtils";
import type { Habit, HabitFrequency, HabitInput } from "@/lib/types";
import type { SnackbarVariant } from "@/components/ui/Snackbar";

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
  setSnackbar: (state: SnackbarState) => void;
};

export function useHabitActions({ user, setSnackbar }: UseHabitActionsOptions) {
  const [habitForm, setHabitForm] = useState<HabitInput>({
    title: "",
    reminderTime: "",
    reminderDays: getDefaultReminderDays("daily"),
    frequency: "daily"
  });
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [confirmHabitDeleteId, setConfirmHabitDeleteId] = useState<string | null>(null);

  const resetHabitForm = useCallback(() => {
    const now = new Date();
    setHabitForm({
      title: "",
      reminderTime: formatTimeValue(now),
      reminderDays: getDefaultReminderDays("daily"),
      frequency: "daily"
    });
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
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      if (name === "frequency") {
        const nextFrequency = value as HabitFrequency;
        setHabitForm((prev) => ({
          ...prev,
          frequency: nextFrequency,
          reminderDays: getDefaultReminderDays(nextFrequency)
        }));
        return;
      }
      setHabitForm((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

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
      if (!habitForm.title.trim()) {
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
            title: habitForm.title.trim(),
            reminderTime: habitForm.reminderTime,
            reminderDays: habitForm.reminderDays,
            frequency: habitForm.frequency,
            updatedAt: serverTimestamp()
          });
          setSnackbar({ message: "Habit updated.", variant: "success" });
        } else {
          await addDoc(collection(db, "users", user.uid, "habits"), {
            title: habitForm.title.trim(),
            reminderTime: habitForm.reminderTime,
            reminderDays: habitForm.reminderDays,
            frequency: habitForm.frequency,
            completionDates: [],
            timezone: getLocalTimeZone(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            author_uid: user.uid,
            lastNotifiedDate: null,
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
      const isCompleted = completionDates.includes(todayKey);
      const nextDates = isCompleted
        ? completionDates.filter((date) => date !== todayKey)
        : [...completionDates, todayKey];
      setActionLoading(true);
      try {
        await updateDoc(doc(db, "users", user.uid, "habits", habit.id), {
          completionDates: nextDates,
          updatedAt: serverTimestamp()
        });
        setSnackbar({
          message: isCompleted ? "Habit reset for today." : "Nice work! Habit completed.",
          variant: "success"
        });
      } catch (error) {
        console.error(error);
        setSnackbar({ message: "Unable to update habit.", variant: "error" });
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
        reminderTime: habit.reminderTime,
        reminderDays: habit.reminderDays?.length
          ? habit.reminderDays
          : getDefaultReminderDays(habit.frequency),
        frequency: habit.frequency
      });
      setIsHabitFormOpen(true);
    },
    []
  );

  const handleDeleteHabitRequest = useCallback((habit: Habit) => {
    setConfirmHabitDeleteId(habit.id);
  }, []);

  const handleDeleteHabit = useCallback(
    async (habitId: string) => {
      if (!user) return;
      setActionLoading(true);
      try {
        await updateDoc(doc(db, "users", user.uid, "habits", habitId), {
          archivedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setSnackbar({ message: "Habit archived.", variant: "info" });
      } catch (error) {
        console.error(error);
        setSnackbar({ message: "Unable to delete habit.", variant: "error" });
      } finally {
        setActionLoading(false);
      }
    },
    [user, setSnackbar]
  );

  return {
    habitForm,
    editingHabitId,
    isHabitFormOpen,
    habitActionLoading: actionLoading,
    selectedHabit,
    confirmHabitDeleteId,
    setSelectedHabit,
    setConfirmHabitDeleteId,
    openHabitModal,
    closeHabitModal,
    handleHabitFormChange,
    handleHabitDayToggle,
    handleHabitDayOfMonthChange,
    handleHabitMonthChange,
    handleSubmitHabit,
    handleToggleHabitCompletion,
    handleEditHabit,
    handleDeleteHabitRequest,
    handleDeleteHabit
  };
}
