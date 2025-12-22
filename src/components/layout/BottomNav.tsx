"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiGrid, FiList, FiUser } from "react-icons/fi";

const navItems = [
  { href: "/", label: "Dashboard", icon: FiGrid },
  { href: "/todos", label: "Todos", icon: FiList },
  { href: "/profile", label: "Profile", icon: FiUser }
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-900/60 bg-slate-950/90 px-6 py-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-around gap-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 text-xs font-semibold tracking-[0.08em] ${
                isActive ? "text-sky-300" : "text-slate-400"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
                  isActive
                    ? "border-sky-400/50 bg-sky-400/10 text-sky-200"
                    : "border-slate-800/70 text-slate-300"
                }`}
              >
                <Icon aria-hidden />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
