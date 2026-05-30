import { Route, Routes, Navigate } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ProtectedRoute } from "@/components/protected-route";

import { HomePage } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { DashboardPage } from "@/pages/dashboard";
import { SearchPage } from "@/pages/search";
import { TrendsPage } from "@/pages/trends";
import { BookmarksPage } from "@/pages/bookmarks";
import { NotificationsPage } from "@/pages/notifications";
import { ProfilePage } from "@/pages/profile";
import { PaperDetailPage } from "@/pages/papers/paper-detail";
import { ReportsListPage } from "@/pages/reports/reports-list";
import { ReportViewerPage } from "@/pages/reports/report-viewer";
import { ProjectsListPage } from "@/pages/projects/projects-list";
import { ProjectDetailPage } from "@/pages/projects/project-detail";
import { ResearchGapsPage } from "@/pages/research-gaps";
import { AdminSyncPage } from "@/pages/admin/sync";
import { AdminUsersPage } from "@/pages/admin/users";
import { NotFoundPage } from "@/pages/not-found";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/papers/:id" element={<PaperDetailPage />} />
        <Route path="/trends" element={<TrendsPage />} />

        {/* Protected (any signed-in user) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/reports" element={<ReportsListPage />} />
          <Route path="/reports/:id" element={<ReportViewerPage />} />
          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/research-gaps" element={<ResearchGapsPage />} />

          {/* Admin (additional role check inside each page) */}
          <Route path="/admin/sync" element={<AdminSyncPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>

        {/* 404 catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
    </Routes>
  );
}
