import type { ReactNode } from "react";

const labelClasses = "flex flex-col gap-1.5";
const labelTextClasses =
  "text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400";
const controlClasses =
  "flex items-center gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/50 px-4 py-2.5 text-slate-200 shadow-sm transition-colors duration-200 ease-out focus-within:border-emerald-300/60 focus-within:bg-slate-950/70 focus-within:ring-2 focus-within:ring-emerald-300/15";

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
      <span className={labelTextClasses}>{label}</span>
      <span
        className={`${controlClasses}${controlClassName ? ` ${controlClassName}` : ""}`}
      >
        {icon}
        {children}
      </span>
    </label>
  );
}
