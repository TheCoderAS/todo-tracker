import { Suspense, lazy } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { AuthProvider } from "@/components/auth/AuthProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import PwaManager from "@/components/pwa/PwaManager";
import OverlayLoader from "@/components/ui/OverlayLoader";
import AppLayout from "@/layouts/AppLayout";

// Route-level code splitting: each page ships in its own chunk and is only
// downloaded when the user navigates to it.
const AuthPage = lazy(() => import("@/pages/auth/AuthPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const RoutinesPage = lazy(() => import("@/pages/RoutinesPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const TodosPage = lazy(() => import("@/pages/TodosPage"));

const ProtectedLayout = () => (
  <ProtectedRoute>
    <AppLayout>
      <Outlet />
    </AppLayout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100">
          <Suspense fallback={<OverlayLoader />}>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/todos" element={<TodosPage />} />
                <Route path="/routines" element={<RoutinesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <PwaManager />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}
