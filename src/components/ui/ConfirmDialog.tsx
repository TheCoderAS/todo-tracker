"use client";

import Modal from "@/components/ui/Modal";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} ariaLabel={title}>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="text-sm text-slate-300">{description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-full border border-slate-700/70 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="rounded-full bg-rose-400 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-rose-500/30 transition hover:bg-rose-300 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
