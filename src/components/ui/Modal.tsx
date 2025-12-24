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
      ? "items-end justify-center pb-8"
      : "items-center justify-center";
  const panelClass =
    variant === "bottom-sheet"
      ? "max-h-[85vh] w-full max-w-xl rounded-t-3xl rounded-b-2xl"
      : "max-h-full w-full max-w-2xl rounded-3xl";

  return createPortal(
    <div
      className={`fixed inset-0 z-[1000] flex px-4 py-10 backdrop-blur-sm backdrop-saturate-150 transition-opacity duration-300 ease-out ${layoutClass} ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden />
      <div
        className={`relative overflow-y-auto border border-slate-800/70 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/60 transition-all duration-[280ms] ease-out ${panelClass} ${
          isClosing ? "translate-y-4 scale-95 opacity-0" : "translate-y-0 scale-100 opacity-100"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
