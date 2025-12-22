"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const next = encodeURIComponent(pathname ?? "/");
      router.replace(`/auth?next=${next}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return null;
  }

  return <>{children}</>;
}
