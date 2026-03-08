import { useCallback, useState } from "react";

import type { Subtask, TodoInput, TodoPriority } from "@/lib/types";

const defaultForm: TodoInput = {
  title: "",
  scheduledDate: "",
  scheduledTime: "",
  priority: "medium",
  tags: "",
  contextTags: [],
  description: "",
  recurrence: "none",
  subtasks: []
};

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTimeValue = (date: Date) => {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const getDefaultSchedule = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const remainder = minutes % 30;
  const addMinutes = remainder === 0 ? 30 : 30 - remainder;
  const slot = new Date(now.getTime() + addMinutes * 60000);
  return {
    scheduledDate: formatDateValue(slot),
    scheduledTime: formatTimeValue(slot)
  };
};

export { formatDateValue, formatTimeValue };

export const normalizeTitle = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
};

export const priorities: TodoPriority[] = ["low", "medium", "high"];

export function useTodoFormState() {
  const [form, setForm] = useState<TodoInput>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [titleHasError, setTitleHasError] = useState(false);
  const [scheduleHasError, setScheduleHasError] = useState(false);

  const isEditing = Boolean(editingId);

  const resetForm = useCallback(() => {
    setForm({ ...defaultForm, ...getDefaultSchedule() });
    setEditingId(null);
    setTitleHasError(false);
    setScheduleHasError(false);
  }, []);

  const openCreateModal = useCallback(() => {
    resetForm();
    setIsFormOpen(true);
  }, [resetForm]);

  const closeFormModal = useCallback(() => {
    resetForm();
    setIsFormOpen(false);
  }, [resetForm]);

  const handleFormChange = useCallback(
    (
      event:
        | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
        | { target: { name: string; value: string[] } }
    ) => {
      const { name, value } = event.target;
      if (name === "contextTags" && Array.isArray(value)) {
        setForm((prev) => ({ ...prev, contextTags: value }));
        return;
      }
      let nextValue: string | number = value as string;
      if (name === "tags") {
        nextValue = (value as string).toLowerCase();
      }
      if (name === "title") {
        nextValue = (value as string).slice(0, 40);
        if ((nextValue as string).trim() && (nextValue as string).trim().length <= 40) {
          setTitleHasError(false);
        }
      }
      setForm((prev) => {
        const nextForm = { ...prev, [name]: nextValue };
        if (name === "scheduledDate" || name === "scheduledTime") {
          const hasScheduledDate = Boolean(nextForm.scheduledDate.trim());
          const hasScheduledTime = Boolean(nextForm.scheduledTime.trim());
          if (hasScheduledDate && hasScheduledTime) {
            setScheduleHasError(false);
          }
        }
        return nextForm;
      });
    },
    []
  );

  const handleDescriptionChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, description: value }));
  }, []);

  const handleSubtasksChange = useCallback((subtasks: Subtask[]) => {
    setForm((prev) => ({ ...prev, subtasks }));
  }, []);

  return {
    form,
    setForm,
    editingId,
    setEditingId,
    isFormOpen,
    setIsFormOpen,
    isEditing,
    titleHasError,
    setTitleHasError,
    scheduleHasError,
    setScheduleHasError,
    resetForm,
    openCreateModal,
    closeFormModal,
    handleFormChange,
    handleDescriptionChange,
    handleSubtasksChange
  };
}
