import { useState } from "react";
import { FiArrowRight, FiCheck, FiGrid, FiList, FiRepeat, FiSearch, FiZap } from "react-icons/fi";

import Modal from "@/components/ui/Modal";

type OnboardingModalProps = {
  isOpen: boolean;
  onComplete: () => void;
};

const steps = [
  {
    icon: FiZap,
    iconColor: "text-emerald-300",
    title: "Welcome to Aura Pulse",
    description:
      "Your personal productivity companion. Manage tasks, build habits, and track your progress — all in one place."
  },
  {
    icon: FiList,
    iconColor: "text-sky-300",
    title: "Smart task management",
    description:
      "Create todos with priorities, tags, subtasks, and scheduled dates. Filter and sort to focus on what matters most."
  },
  {
    icon: FiRepeat,
    iconColor: "text-amber-300",
    title: "Habits & recurrence",
    description:
      "Build daily, weekly, or monthly habits. Recurring tasks auto-create the next occurrence when you complete one."
  },
  {
    icon: FiGrid,
    iconColor: "text-cyan-300",
    title: "Dashboard analytics",
    description:
      "See your productivity score, weekly trends, habit streaks, and completion heatmaps at a glance."
  },
  {
    icon: FiSearch,
    iconColor: "text-violet-300",
    title: "Quick actions",
    description:
      "Press ⌘K to search everything. Use keyboard shortcuts like N (new), F (filter), and 1/2 to switch tabs."
  }
];

export default function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onComplete} ariaLabel="Welcome onboarding">
      <div className="grid gap-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-800/70 bg-slate-900/60">
            <current.icon className={`text-2xl ${current.iconColor}`} aria-hidden />
          </div>
        </div>

        <div className="grid gap-2">
          <h2 className="text-xl font-bold text-white">{current.title}</h2>
          <p className="mx-auto max-w-sm text-sm text-slate-400">{current.description}</p>
        </div>

        <div className="flex items-center justify-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-6 bg-emerald-400"
                  : i < step
                  ? "w-1.5 bg-emerald-400/40"
                  : "w-1.5 bg-slate-700"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="text-xs font-semibold text-slate-500 transition hover:text-slate-300"
            onClick={onComplete}
          >
            Skip
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-300 active:scale-95"
            onClick={handleNext}
          >
            {isLast ? (
              <>
                <FiCheck aria-hidden />
                Get started
              </>
            ) : (
              <>
                Next
                <FiArrowRight aria-hidden />
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
