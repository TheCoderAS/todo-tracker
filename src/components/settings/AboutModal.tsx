import { FiX } from "react-icons/fi";

import Modal from "@/components/ui/Modal";

type AboutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  appName: string;
  appVersion: string;
};

export default function AboutModal({
  isOpen,
  onClose,
  appName,
  appVersion
}: AboutModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="About">
      <div className="grid gap-4">
        <div className="modal-header flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">About NizKarya</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full border border-slate-700/70 px-3 py-2 text-xs font-medium uppercase text-slate-300 transition hover:border-slate-500/80 hover:text-white"
          >
            <FiX />
          </button>
        </div>
        <div className="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4">
          <p className="text-xs uppercase text-slate-400">Version</p>
          <p className="text-sm text-slate-100">
            {appName} v{appVersion}
          </p>
          <p className="mt-1 text-xs text-faint">Own your day.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4">
            <p className="text-xs uppercase text-slate-400">Developer</p>
            <p className="text-sm text-slate-100">NizKarya Studio</p>
            <p className="text-xs text-slate-500">hello@nizkarya.app</p>
          </div>
          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4">
            <p className="text-xs uppercase text-slate-400">App details</p>
            <p className="text-sm text-slate-100">
              Daily planning, habit building, routines, focus sessions, and review
              workflows.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4">
          <p className="text-xs uppercase text-slate-400">Vision &amp; mission</p>
          <p className="text-sm text-slate-100">
            Empower people to build calm, consistent momentum through intentional
            planning, mindful habits, and clear daily focus. NizKarya exists to make
            progress feel lighter, clearer, and repeatable.
          </p>
        </div>
      </div>
    </Modal>
  );
}
