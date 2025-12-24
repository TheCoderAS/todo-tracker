import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/components/auth/AuthProvider";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const next = encodeURIComponent(`${location.pathname}${location.search}`);
      navigate(`/auth?next=${next}`, { replace: true });
    }
  }, [loading, user, navigate, location.pathname, location.search]);

  if (loading || !user) {
    return null;
  }

  return <>{children}</>;
}
