import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { AuthProvider } from "@/components/auth/AuthProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PwaManager from "@/components/pwa/PwaManager";
import AppLayout from "@/layouts/AppLayout";
import AuthPage from "@/pages/auth/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import SettingsPage from "@/pages/SettingsPage";
import RoutinesPage from "@/pages/RoutinesPage";
import TodosPage from "@/pages/TodosPage";

const ProtectedLayout = () => (
  <ProtectedRoute>
    <AppLayout>
      <Outlet />
    </AppLayout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/todos" element={<TodosPage />} />
            <Route path="/routines" element={<RoutinesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<Navigate to="/settings" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <PwaManager />
      </div>
    </AuthProvider>
  );
}
