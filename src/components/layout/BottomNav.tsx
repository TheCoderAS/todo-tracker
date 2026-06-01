import { Link, useLocation } from "react-router-dom";
import { FiHome, FiCheckSquare, FiRepeat, FiUser } from "react-icons/fi";

const navItems = [
  { href: "/", label: "Today", icon: FiHome },
  { href: "/todos", label: "Plan", icon: FiCheckSquare },
  { href: "/routines", label: "Routines", icon: FiRepeat },
  { href: "/settings", label: "Profile", icon: FiUser }
];

export default function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
      <div className="surface-card-strong mx-auto flex w-full max-w-md items-center justify-around gap-1 rounded-full px-2 py-2 shadow-pop">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              to={href}
              className="group flex flex-1 flex-col items-center gap-1"
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg transition-all duration-200 ease-out ${
                  isActive
                    ? "nav-icon-pop gradient-brand text-white shadow-pop"
                    : "text-muted group-hover:text-[var(--text)]"
                }`}
              >
                <Icon aria-hidden />
              </span>
              <span
                className={`text-[0.65rem] transition-colors duration-200 ease-out ${
                  isActive ? "text-[var(--text)]" : "text-faint"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
