"use client";

import Image from "next/image";
import { FiLogOut } from "react-icons/fi";

type AppHeaderProps = {
  showSignOut: boolean;
  onSignOut: () => void;
};

export default function AppHeader({ showSignOut, onSignOut }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 -mx-6 flex items-center justify-between gap-4 border-b border-slate-900/60 bg-slate-950/85 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 shadow-xl shadow-slate-900/40">
          <Image
            src="/aura-pulse.png"
            alt="Aura Pulse logo"
            width={40}
            height={40}
            sizes="40px"
            className="h-10 w-10 rounded-xl object-contain"
            priority
            unoptimized
          />
        </div>
        <span className="text-sm font-semibold tracking-[0.2em] text-slate-200">
          Aura Pulse
        </span>
      </div>
      {showSignOut ? (
        <button
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-700/70 text-slate-200 transition hover:border-slate-500"
          onClick={onSignOut}
          aria-label="Sign out"
        >
          <FiLogOut aria-hidden />
        </button>
      ) : null}
    </header>
  );
}
