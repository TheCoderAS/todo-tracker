import type { ReactNode } from "react";

const labelClasses =
  "flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400";
const controlClasses =
  "flex items-center gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3 text-slate-200";

export type FieldProps = {
  label: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  controlClassName?: string;
};

export default function Field({
  label,
  icon,
  children,
  className,
  controlClassName
}: FieldProps) {
  return (
    <label className={`${labelClasses}${className ? ` ${className}` : ""}`}>
      {label}
      <span
        className={`${controlClasses}${controlClassName ? ` ${controlClassName}` : ""}`}
      >
        {icon}
        {children}
      </span>
    </label>
  );
}
