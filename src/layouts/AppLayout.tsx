import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import OverlayLoader from "@/components/ui/OverlayLoader";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading, signOutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignOut = async () => {
    setShowConfirm(false);
    setIsSigningOut(true);
    try {
      await signOutUser();
      const nextPath = location.pathname + location.search;
      navigate(`/auth?next=${encodeURIComponent(nextPath || "/")}`, { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <AppHeader showSignOut onSignOut={() => setShowConfirm(true)} />
      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 pb-24 pt-20 text-slate-100">
        {children}
      </main>
      <BottomNav />
      <ConfirmDialog
        isOpen={showConfirm}
        title="Sign out of Aura Pulse?"
        description="You will be signed out and need to log in again to access your account."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        isLoading={isSigningOut}
        onConfirm={handleSignOut}
        onCancel={() => setShowConfirm(false)}
      />
      {loading || isSigningOut ? <OverlayLoader /> : null}
    </>
  );
}
