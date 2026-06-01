import type { ReactNode } from "react";

type SettingCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  children?: ReactNode;
};

/**
 * Shared layout for a single settings row: leading icon, title/description,
 * and an optional trailing action (button or toggle) plus optional body.
 */
export default function SettingCard({
  icon,
  title,
  description,
  action,
  children
}: SettingCardProps) {
  return (
    <div className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-2 text-slate-300">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{title}</p>
            <p className="text-xs text-slate-400">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
