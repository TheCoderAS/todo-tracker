import type { ElementType } from "react";

export type FeatureCardProps = {
  title: string;
  description: string;
  icon: ElementType;
};

export default function FeatureCard({ title, description, icon: Icon }: FeatureCardProps) {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-200">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}
