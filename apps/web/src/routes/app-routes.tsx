import { Route, Routes } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ProtectedRoute } from "@/components/protected-route";
import { HomePage } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { DashboardPage } from "@/pages/dashboard";
import { SearchPage } from "@/pages/search";

export function AppRoutes() {
  return (
    <Routes>
      {/* Public + auth-gated routes that share the chrome (header/footer) */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />

        {/* Authenticated-only group */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/search" element={<SearchPage />} />
          {/* TODO: /papers/:id, /trends, /reports */}
        </Route>
      </Route>

      {/* Auth pages live under a different layout (centered card, no header) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
    </Routes>
  );
}
