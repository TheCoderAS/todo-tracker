"use client";

import Image from "next/image";
import { FiLogOut } from "react-icons/fi";

type AppHeaderProps = {
  showSignOut: boolean;
  onSignOut: () => void;
};

export default function AppHeader({ showSignOut, onSignOut }: AppHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 border-b border-slate-900/60 bg-slate-950/90 px-6 py-2 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 shadow-xl shadow-slate-900/40 no-invert">
          <Image
            src="/aura-pulse.png"
            alt="Aura Pulse logo"
            width={40}
            height={40}
            sizes="40px"
            className="h-8 w-8 rounded-xl object-contain no-invert"
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
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/70 text-slate-200 transition hover:border-slate-500"
          onClick={onSignOut}
          aria-label="Sign out"
        >
          <FiLogOut aria-hidden />
        </button>
      ) : null}
      </div>
    </header>
  );
}
