import { useEffect } from "react";
import type { ReactNode } from "react";
import { FiX } from "react-icons/fi";

export type SnackbarVariant = "success" | "error" | "info";

type SnackbarProps = {
  message: ReactNode;
  variant?: SnackbarVariant;
  onDismiss: () => void;
};

const variantStyles: Record<SnackbarVariant, string> = {
  success: "border-emerald-500 bg-emerald-500 text-emerald-950",
  error: "border-rose-500 bg-rose-500 text-rose-950",
  info: "border-sky-500 bg-sky-500 text-sky-950"
};

export default function Snackbar({
  message,
  variant = "info",
  onDismiss
}: SnackbarProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onDismiss();
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [onDismiss]);

  return (
    <div
      className={`fixed right-6 top-24 z-[9999] flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-xl ${
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
