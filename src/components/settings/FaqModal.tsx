import { FiX } from "react-icons/fi";

import Modal from "@/components/ui/Modal";

type FaqSection = {
  title: string;
  intro: string;
  steps: string[];
};

const FAQ_SECTIONS: FaqSection[] = [
  {
    title: "Tasks (Todos)",
    intro: "Create focused tasks and organize them so they surface in your daily plan.",
    steps: [
      "Open the Tasks tab and tap the + button to add a new todo.",
      "Give it a clear title, then pick a date and time for scheduling.",
      "Set priority, tags, and context tags to help with filtering later.",
      "Expand the description editor to add notes or links.",
      "Save to place the task into your daily plan or review list."
    ]
  },
  {
    title: "Habits",
    intro: "Build consistency by scheduling habits and tracking streaks.",
    steps: [
      "Switch to the Habits tab and tap the + button to create one.",
      "Name the habit, select positive or negative, and choose frequency.",
      "Pick reminder days and a time so it shows up in your daily list.",
      "Add context tags to group similar routines or focus themes.",
      "Save, then tap the habit each day to log your progress."
    ]
  },
  {
    title: "Routines",
    intro: "Save repeatable sequences so you can launch them in one tap.",
    steps: [
      "Open Routines and choose “Add routine” from the toolbar.",
      "Add each step as a template task with tags and descriptions.",
      "Save the routine, then run it to add tasks to today’s plan.",
      "Open the routine list anytime to update or delete steps."
    ]
  },
  {
    title: "Focus sessions",
    intro: "Use focus mode to stay on track and measure your momentum.",
    steps: [
      "Open the Focus panel from the dashboard or the Focus tab.",
      "Select the tasks and habits you want to prioritize today.",
      "Start the session and work through items one at a time.",
      "End the session to review completion rates and insights."
    ]
  },
  {
    title: "Dashboard insights",
    intro: "Read trends and completion cues so you can adjust your plan.",
    steps: [
      "Check the daily stats card for tasks and habit streaks.",
      "Scan the weekly trend cards to see completion patterns.",
      "Use review alerts to reschedule or archive missed items.",
      "Return to the dashboard after updates to confirm progress."
    ]
  },
  {
    title: "Common concerns",
    intro: "Quick fixes for the most frequent setup questions.",
    steps: [
      "Open Settings to confirm notifications are turned on.",
      "Check device notification permissions if alerts feel quiet.",
      "Use context tags to filter habits and tasks faster.",
      "Reset your password from Settings if you forget it."
    ]
  }
];

type FaqModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function FaqModal({ isOpen, onClose }: FaqModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="FAQs">
      <div className="grid gap-4">
        <div className="modal-header flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">FAQs &amp; how-to guide</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full border border-slate-700/70 px-3 py-2 text-xs font-medium uppercase text-slate-300 transition hover:border-slate-500/80 hover:text-white"
          >
            <FiX />
          </button>
        </div>

        <div className="grid gap-4">
          {FAQ_SECTIONS.map((section) => (
            <div
              key={section.title}
              className="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4"
            >
              <h4 className="text-sm font-medium text-white">{section.title}</h4>
              <p className="mt-2 text-xs text-slate-400">{section.intro}</p>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-200">
                {section.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
