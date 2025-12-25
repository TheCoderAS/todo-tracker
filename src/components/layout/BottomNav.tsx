import { Link, useLocation } from "react-router-dom";
import { FiGrid, FiList, FiRepeat, FiUser } from "react-icons/fi";

const navItems = [
  { href: "/", label: "Dashboard", icon: FiGrid },
  { href: "/todos", label: "Tasks", icon: FiList },
  { href: "/routines", label: "Routines", icon: FiRepeat },
  { href: "/profile", label: "Profile", icon: FiUser }
];

export default function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-900/60 bg-gradient-to-r from-slate-950/95 via-slate-950/90 to-slate-950/95 px-6 py-2 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-around gap-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              to={href}
              className={`group flex flex-1 flex-col items-center gap-1 text-xs font-semibold transition-colors duration-200 ease-out ${
                isActive ? "text-sky-200" : "text-slate-400"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-all duration-200 ease-out ${
                  isActive
                    ? "nav-icon-pop border-sky-400/60 bg-sky-400/15 text-sky-100 shadow-lg shadow-sky-500/20"
                    : "border-slate-800/70 text-slate-300 group-hover:border-slate-600/70 group-hover:text-slate-100"
                }`}
              >
                <Icon aria-hidden />
              </span>
              <span className="transition-colors duration-200 ease-out group-hover:text-slate-100">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
