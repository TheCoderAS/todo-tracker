import { useEffect } from "react";
import type { ReactNode } from "react";
import { FiRotateCcw, FiX } from "react-icons/fi";

export type SnackbarVariant = "success" | "error" | "info";

type SnackbarProps = {
  message: ReactNode;
  variant?: SnackbarVariant;
  onDismiss: () => void;
  onUndo?: () => void;
};

const variantStyles: Record<SnackbarVariant, string> = {
  success: "border-emerald-500/60 bg-emerald-500/20 text-emerald-100",
  error: "border-rose-500/60 bg-rose-500/20 text-rose-100",
  info: "border-sky-500/60 bg-sky-500/20 text-sky-100"
};

export default function Snackbar({
  message,
  variant = "info",
  onDismiss,
  onUndo
}: SnackbarProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onDismiss();
    }, onUndo ? 6000 : 4500);

    return () => window.clearTimeout(timeoutId);
  }, [onDismiss, onUndo]);

  return (
    <div
      className={`fixed right-6 top-24 z-[9999] flex max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-xl backdrop-blur-lg ${
        variantStyles[variant]
      }`}
      role="status"
    >
      <span className="flex-1">{message}</span>
      {onUndo ? (
        <button
          type="button"
          onClick={() => {
            onUndo();
            onDismiss();
          }}
          className="flex items-center gap-1 rounded-full border border-white/20 px-2 py-1 text-xs font-semibold text-current transition hover:bg-white/10"
        >
          <FiRotateCcw className="h-3 w-3" />
          Undo
        </button>
      ) : null}
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
