import type { ChangeEvent, FormEvent } from "react";
import { FiSave, FiX } from "react-icons/fi";

import Modal from "@/components/ui/Modal";

export type ProfileFormState = {
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
};

const inputClasses =
  "w-full rounded-2xl border border-slate-800/70 bg-slate-950/55 px-3.5 py-2.5 text-sm text-slate-100 shadow-sm transition-colors duration-200 ease-out focus:border-emerald-300/60 focus:bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-emerald-300/15";
const labelClasses = "flex flex-col gap-1.5";
const labelTextClasses =
  "text-[0.7rem] font-medium uppercase tracking-wide text-slate-400";

type ProfileModalProps = {
  isOpen: boolean;
  form: ProfileFormState;
  isSaving: boolean;
  onClose: () => void;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (event: FormEvent) => void;
};

export default function ProfileModal({
  isOpen,
  form,
  isSaving,
  onClose,
  onChange,
  onSubmit
}: ProfileModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Edit profile">
      <form className="grid gap-5" onSubmit={onSubmit}>
        <div className="modal-header flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Update profile</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full border border-slate-700/70 px-3 py-2 text-xs font-medium uppercase text-slate-300 transition hover:border-slate-500/80 hover:text-white"
          >
            <FiX />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClasses}>
            <span className={labelTextClasses}>First name</span>
            <input
              name="firstName"
              placeholder="Jane"
              value={form.firstName}
              onChange={onChange}
              className={inputClasses}
            />
          </label>
          <label className={labelClasses}>
            <span className={labelTextClasses}>Last name</span>
            <input
              name="lastName"
              placeholder="Doe"
              value={form.lastName}
              onChange={onChange}
              className={inputClasses}
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClasses}>
            <span className={labelTextClasses}>Phone</span>
            <input
              name="phone"
              placeholder="+1 (555) 123-4567"
              value={form.phone}
              onChange={onChange}
              className={inputClasses}
            />
          </label>
          <label className={labelClasses}>
            <span className={labelTextClasses}>Gender</span>
            <select
              name="gender"
              value={form.gender}
              onChange={onChange}
              className={inputClasses}
            >
              <option value="">Select</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </label>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-medium text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.45)] transition hover:bg-emerald-300 active:scale-[0.98]"
            disabled={isSaving}
          >
            <FiSave aria-hidden />
            Save profile
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-700/70 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500/80 hover:text-white active:scale-[0.98]"
            onClick={onClose}
            disabled={isSaving}
          >
            <FiX aria-hidden />
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
