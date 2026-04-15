import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { AddCar } from "@/pages/AddCar";
import { CarsList } from "@/pages/CarsList";
import NotFound from "./pages/NotFound";
import { UsersPage } from "./pages/UsersPage";
import Appointments from "@/pages/Appointments";

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requireRole?: "reception" | "viewer";
  requireRoles?: Array<"reception" | "viewer" | "admin">;
}> = ({ children, requireRole, requireRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // Wait for Supabase Auth to restore the session before deciding anything.
  // Without this, a page refresh would always flash-redirect to /login.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && user?.role !== requireRole) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireRoles && user && !requireRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  // While restoring the session, show nothing (ProtectedRoute handles its own spinner)
  // but prevent the /login redirect from firing prematurely
  return (
    <Routes>
      <Route
        path="/login"
        element={
          !loading && isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <Login />
        }
      />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute requireRoles={["admin", "viewer", "reception"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="add-car"
          element={
            <ProtectedRoute requireRoles={["admin", "reception"]}>
              <AddCar />
            </ProtectedRoute>
          }
        />
        <Route
          path="cars"
          element={
            <ProtectedRoute requireRoles={["admin", "viewer", "reception"]}>
              <CarsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute requireRoles={["admin"]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="appointments"
          element={
            <ProtectedRoute requireRoles={["admin", "reception"]}>
              <Appointments />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
