type ToggleSwitchProps = {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
  onLabel?: string;
  offLabel?: string;
};

/**
 * Accessible on/off switch used by the theme and notification settings.
 */
export default function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
  onLabel = "On",
  offLabel = "Off"
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`relative flex h-8 w-16 items-center rounded-full border transition ${
        checked
          ? "border-emerald-400/70 bg-emerald-400/20"
          : "border-slate-700/70 bg-slate-900/60"
      }`}
    >
      <span
        className={`absolute left-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-all ${
          checked
            ? "translate-x-8 bg-emerald-400 text-slate-950"
            : "translate-x-0 bg-slate-700 text-slate-200"
        }`}
      >
        {checked ? onLabel : offLabel}
      </span>
    </button>
  );
}
