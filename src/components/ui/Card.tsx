import type { ReactNode } from "react";

const baseClasses =
  "rounded-3xl border border-slate-800/60 bg-slate-900/50 p-8 shadow-2xl shadow-slate-950/40";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className }: CardProps) {
  return (
    <div className={`${baseClasses}${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
