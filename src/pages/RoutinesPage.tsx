import { useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc
} from "firebase/firestore";

import { useAuth } from "@/components/auth/AuthProvider";
import RoutineForm from "@/components/routines/RoutineForm";
import RoutineSection from "@/components/routines/RoutineSection";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import OverlayLoader from "@/components/ui/OverlayLoader";
import Snackbar, { type SnackbarVariant } from "@/components/ui/Snackbar";
import { useRoutinesData } from "@/hooks/todos/useRoutinesData";
import { db } from "@/lib/firebase";
import type {
  Routine,
  RoutineInput,
  RoutineItemInput,
  TodoPriority
} from "@/lib/types";

const priorities: TodoPriority[] = ["low", "medium", "high"];

const createEmptyRoutineItem = (): RoutineItemInput => ({
  title: "",
  priority: "medium",
  tags: "",
  contextTags: "",
  description: ""
});

const defaultRoutineForm: RoutineInput = {
  title: "",
  items: [createEmptyRoutineItem()]
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

const getDefaultSchedule = () => {
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

const normalizeTitle = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
};

export default function RoutinesPage() {
  const { user, loading } = useAuth();
  const { routines, isInitialLoad } = useRoutinesData(user);
  const [routineForm, setRoutineForm] = useState<RoutineInput>(defaultRoutineForm);
  const [isRoutineFormOpen, setIsRoutineFormOpen] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmRoutineDelete, setConfirmRoutineDelete] = useState<Routine | null>(null);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    variant: SnackbarVariant;
  } | null>(null);

  const isRoutineLoading = loading || isInitialLoad;

  const openRoutineModal = () => {
    setEditingRoutineId(null);
    setRoutineForm({ title: "", items: [createEmptyRoutineItem()] });
    setIsRoutineFormOpen(true);
  };

  const closeRoutineModal = () => {
    setEditingRoutineId(null);
    setRoutineForm({ title: "", items: [createEmptyRoutineItem()] });
    setIsRoutineFormOpen(false);
  };

  const handleRoutineTitleChange = (value: string) => {
    setRoutineForm((prev) => ({ ...prev, title: value.slice(0, 40) }));
  };

  const handleRoutineItemChange = (
    index: number,
    field: keyof RoutineItemInput,
    value: string
  ) => {
    setRoutineForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleAddRoutineItem = () => {
    setRoutineForm((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyRoutineItem()]
    }));
  };

  const handleRemoveRoutineItem = (index: number) => {
    setRoutineForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutineId(routine.id);
    setRoutineForm({
      title: routine.title,
      items: routine.items.map((item) => ({
        title: item.title,
        priority: item.priority,
        tags: item.tags.join(", "),
        contextTags: item.contextTags.join(", "),
        description: item.description
      }))
    });
    setIsRoutineFormOpen(true);
  };

  const handleDeleteRoutineRequest = (routine: Routine) => {
    setConfirmRoutineDelete(routine);
  };

  const parseTagInput = (value: string) =>
    value
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

  const handleSubmitRoutine = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      setSnackbar({ message: "Sign in to manage routines.", variant: "error" });
      return;
    }

    const normalizedTitle = normalizeTitle(routineForm.title);
    if (!normalizedTitle) {
      setSnackbar({ message: "Add a routine name to continue.", variant: "error" });
      return;
    }

    if (!routineForm.items.length) {
      setSnackbar({
        message: "Add at least one template item to continue.",
        variant: "error"
      });
      return;
    }

    const missingItem = routineForm.items.find((item) => !item.title.trim());
    if (missingItem) {
      setSnackbar({
        message: "Add a title for each routine item.",
        variant: "error"
      });
      return;
    }

    setActionLoading(true);
    try {
      const items = routineForm.items.map((item) => ({
        title: normalizeTitle(item.title),
        priority: item.priority,
        tags: parseTagInput(item.tags),
        contextTags: parseTagInput(item.contextTags),
        description: item.description.trim()
      }));

      if (editingRoutineId) {
        await updateDoc(doc(db, "users", user.uid, "routines", editingRoutineId), {
          title: normalizedTitle,
          items,
          author_uid: user.uid,
          updatedAt: serverTimestamp()
        });
        setSnackbar({ message: "Routine updated.", variant: "success" });
      } else {
        await addDoc(collection(db, "users", user.uid, "routines"), {
          title: normalizedTitle,
          items,
          author_uid: user.uid,
          createdAt: serverTimestamp()
        });
        setSnackbar({ message: "Routine saved.", variant: "success" });
      }
      closeRoutineModal();
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to save routine.", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRoutine = async (routine: Routine) => {
    if (!user) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "users", user.uid, "routines", routine.id));
      setSnackbar({ message: "Routine deleted.", variant: "info" });
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to delete routine.", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunRoutine = async (routine: Routine) => {
    if (!user) {
      setSnackbar({ message: "Sign in to run routines.", variant: "error" });
      return;
    }
    if (!routine.items.length) {
      setSnackbar({ message: "This routine has no template items.", variant: "error" });
      return;
    }

    setActionLoading(true);
    try {
      const { scheduledDate, scheduledTime } = getDefaultSchedule();
      const scheduledDateValue = Timestamp.fromDate(
        new Date(`${scheduledDate}T${scheduledTime}`)
      );
      await Promise.all(
        routine.items.map((item) =>
          addDoc(collection(db, "users", user.uid, "todos"), {
            title: normalizeTitle(item.title),
            scheduledDate: scheduledDateValue,
            createdAt: serverTimestamp(),
            author_uid: user.uid,
            priority: item.priority,
            status: "pending",
            completedDate: null,
            skippedAt: null,
            tags: item.tags,
            contextTags: item.contextTags,
            description: item.description
          })
        )
      );
      setSnackbar({ message: "Routine added to today.", variant: "success" });
    } catch (error) {
      console.error(error);
      setSnackbar({ message: "Unable to run routine.", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <RoutineSection
        routines={routines}
        onOpenCreate={openRoutineModal}
        onEdit={handleEditRoutine}
        onDelete={handleDeleteRoutineRequest}
        onRun={handleRunRoutine}
        isLoading={isRoutineLoading}
      />
      <Modal isOpen={isRoutineFormOpen} onClose={closeRoutineModal} ariaLabel="Routine form">
        <RoutineForm
          form={routineForm}
          priorities={priorities}
          isEditing={Boolean(editingRoutineId)}
          onTitleChange={handleRoutineTitleChange}
          onItemChange={handleRoutineItemChange}
          onAddItem={handleAddRoutineItem}
          onRemoveItem={handleRemoveRoutineItem}
          onSubmit={handleSubmitRoutine}
          onCancel={closeRoutineModal}
        />
      </Modal>
      <ConfirmDialog
        isOpen={Boolean(confirmRoutineDelete)}
        title="Delete this routine?"
        description="This action cannot be undone."
        confirmLabel="Delete routine"
        cancelLabel="Cancel"
        isLoading={actionLoading}
        onConfirm={() => {
          if (confirmRoutineDelete) {
            handleDeleteRoutine(confirmRoutineDelete);
          }
          setConfirmRoutineDelete(null);
        }}
        onCancel={() => setConfirmRoutineDelete(null)}
      />
      {actionLoading ? <OverlayLoader /> : null}
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
