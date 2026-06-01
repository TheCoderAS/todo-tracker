import { useEffect, useMemo, useRef, useState } from "react";
import { FiBell, FiCheck, FiLogOut, FiSearch } from "react-icons/fi";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch
} from "firebase/firestore";

import { useAuth } from "@/components/auth/AuthProvider";
import SearchModal from "@/components/search/SearchModal";
import { useSearchData } from "@/hooks/useSearchData";
import { db } from "@/lib/firebase";

type AppHeaderProps = {
  showSignOut: boolean;
  onSignOut: () => void;
};

export default function AppHeader({ showSignOut, onSignOut }: AppHeaderProps) {
  const { user } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    {
      id: string;
      title: string;
      body: string;
      createdAt?: Date | null;
      read?: boolean;
    }[]
  >([]);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { todos: searchTodos, habits: searchHabits } = useSearchData(user);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const notificationsQuery = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnapshot) => {
        const payload = docSnapshot.data() as {
          title?: string;
          body?: string;
          createdAt?: { toDate?: () => Date };
          read?: boolean;
        };
        return {
          id: docSnapshot.id,
          title: payload.title ?? "Notification",
          body: payload.body ?? "",
          createdAt: payload.createdAt?.toDate?.() ?? null,
          read: payload.read ?? false
        };
      });
      setNotifications(data);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isNotificationsOpen]);

  const hasUnread = useMemo(
    () => notifications.some((notification) => !notification.read),
    [notifications]
  );

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid, "notifications", notificationId), {
        read: true
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    const unread = notifications.filter((notification) => !notification.read);
    if (!unread.length) return;
    const batch = writeBatch(db);
    unread.forEach((notification) => {
      batch.update(doc(db, "users", user.uid, "notifications", notification.id), {
        read: true
      });
    });
    try {
      await batch.commit();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-20 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))] backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-pop no-invert">
            <img
              src="/nizkarya.png"
              alt="NizKarya logo"
              width={40}
              height={40}
              loading="eager"
              className="h-9 w-9 object-cover no-invert"
            />
          </div>
          <div className="leading-none">
            <span className="block text-base font-semibold gradient-text">NizKarya</span>
            <span className="block text-[0.6rem] uppercase tracking-[0.18em] text-faint">
              Own your day
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                className="flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-sm text-muted transition-all duration-200 ease-out hover:border-[var(--border-strong)] hover:text-[var(--text)]"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search"
              >
                <FiSearch className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline text-xs">Search</span>
                <kbd className="hidden sm:inline-flex items-center rounded border border-[var(--border)] bg-[var(--surface-soft)] px-1 py-0.5 text-[0.55rem] text-faint">
                  ⌘K
                </kbd>
              </button>
              <SearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                todos={searchTodos}
                habits={searchHabits}
              />
            </>
          ) : null}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)] transition-all duration-200 ease-out hover:border-[var(--border-strong)]"
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                aria-label="Open notifications"
                aria-haspopup="menu"
                aria-expanded={isNotificationsOpen}
              >
                <FiBell aria-hidden />
                {hasUnread ? (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--accent-2)] shadow-[0_0_8px_rgba(255,92,138,0.7)]" />
                ) : null}
              </button>
              {isNotificationsOpen ? (
                <div
                  className="floating-menu absolute right-0 mt-3 w-[min(20rem,calc(100vw-2rem))] origin-top-right rounded-2xl border border-slate-800/80 bg-slate-950/95 p-3 shadow-2xl shadow-slate-950/70 backdrop-blur"
                  role="menu"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Notifications
                    </p>
                    <button
                      type="button"
                      className={`text-[0.65rem] font-medium uppercase transition-colors duration-200 ease-out ${
                        hasUnread
                          ? "text-emerald-200/80 hover:text-emerald-100"
                          : "text-slate-500"
                      }`}
                      onClick={handleMarkAllAsRead}
                      disabled={!hasUnread}
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {notifications.length ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="rounded-xl border border-slate-800/70 bg-slate-900/40 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-slate-100">
                                {notification.title}
                              </p>
                              {notification.body ? (
                                <p className="mt-1 text-xs text-slate-400">
                                  {notification.body}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2">
                              {!notification.read ? (
                                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
                              ) : null}
                              <button
                                type="button"
                                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs transition-all duration-200 ease-out ${
                                  notification.read
                                    ? "border-slate-800/70 text-slate-500"
                                    : "border-emerald-400/40 text-emerald-200 hover:border-emerald-300/70 hover:text-emerald-100"
                                }`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                aria-label="Mark notification as read"
                                disabled={notification.read}
                              >
                                <FiCheck aria-hidden />
                              </button>
                            </div>
                          </div>
                          {notification.createdAt ? (
                            <p className="mt-2 text-xs text-slate-500">
                              {notification.createdAt.toLocaleString()}
                            </p>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="rounded-xl border border-dashed border-slate-800/80 px-3 py-6 text-center text-xs text-slate-500">
                        No notifications yet.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          {showSignOut ? (
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)] transition-all duration-200 ease-out hover:border-[var(--border-strong)]"
              onClick={onSignOut}
              aria-label="Sign out"
            >
              <FiLogOut aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
