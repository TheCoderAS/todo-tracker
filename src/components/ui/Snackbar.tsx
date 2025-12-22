import type { ReactNode } from "react";
import { FiX } from "react-icons/fi";

export type SnackbarVariant = "success" | "error" | "info";

type SnackbarProps = {
  message: ReactNode;
  variant?: SnackbarVariant;
  onDismiss: () => void;
};

const variantStyles: Record<SnackbarVariant, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  error: "border-rose-500/30 bg-rose-500/10 text-rose-100",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-100"
};

export default function Snackbar({
  message,
  variant = "info",
  onDismiss
}: SnackbarProps) {
  return (
    <div
      className={`fixed right-6 top-24 z-50 flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-xl ${
        variantStyles[variant]
      }`}
      role="status"
    >
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-full border border-transparent p-1 text-current transition hover:border-white/20"
        aria-label="Dismiss notification"
      >
        <FiX className="h-4 w-4" />
      </button>
    </div>
  );
}
