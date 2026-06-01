"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: React.ReactNode;
  variant?: "center" | "bottom-sheet";
};

const CLOSE_DURATION_MS = 280;

export default function Modal({
  isOpen,
  onClose,
  ariaLabel,
  children,
  variant = "center"
}: ModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      return undefined;
    }

    if (shouldRender) {
      setIsClosing(true);
      const timer = window.setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, CLOSE_DURATION_MS);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [isOpen, shouldRender]);

  useEffect(() => {
    if (!shouldRender) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shouldRender, onClose]);

  if (!shouldRender || !isMounted) return null;

  const layoutClass =
    variant === "bottom-sheet"
      ? "items-end justify-center pb-[max(1rem,env(safe-area-inset-bottom))]"
      : "items-center justify-center";
  const panelClass =
    variant === "bottom-sheet"
      ? "max-h-[85vh] w-full max-w-xl rounded-t-3xl rounded-b-2xl"
      : "max-h-[92vh] w-full max-w-2xl rounded-3xl sm:max-h-[88vh]";

  return createPortal(
    <div
      className={`fixed inset-0 z-[1000] flex px-3 py-4 backdrop-blur-sm backdrop-saturate-150 transition-opacity duration-300 ease-out sm:px-4 sm:py-10 ${layoutClass} ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      {/* Keyboard-accessible backdrop: closes on click, Enter, or Space. */}
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />
      <div
        className={`modal-panel relative overflow-y-auto border border-slate-800/70 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/60 transition-all duration-[280ms] ease-out ${panelClass} ${
          isClosing
            ? "translate-y-4 scale-95 opacity-0"
            : "translate-y-0 scale-100 opacity-100"
        }`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
