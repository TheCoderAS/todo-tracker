"use client";

import { useEffect } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: React.ReactNode;
};

export default function Modal({ isOpen, onClose, ariaLabel, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-10 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-800/70 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/60"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
