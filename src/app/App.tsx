import type React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';
import { UserDashboard } from './pages/UserDashboard';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { UserRankingPage } from './pages/UserRankingPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { RequestPaperPage } from './pages/RequestPaperPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { PaperManagementPage } from './pages/PaperManagementPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { PaperDetailPage } from './pages/PaperDetailPage';
import { getStoredUser, getToken } from './lib/api';
import { ToastProvider } from './components/ToastProvider';

function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactElement;
  role?: 'user' | 'admin';
}) {
  const token = getToken();
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<ProtectedRoute role="user"><UserDashboard /></ProtectedRoute>} />
          <Route path="/my-requests" element={<ProtectedRoute role="user"><MyRequestsPage /></ProtectedRoute>} />
          <Route path="/rankings" element={<ProtectedRoute role="user"><UserRankingPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute role="user"><UserProfilePage /></ProtectedRoute>} />
          <Route path="/request-paper" element={<ProtectedRoute role="user"><RequestPaperPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/papers" element={<ProtectedRoute role="admin"><PaperManagementPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="admin"><UserManagementPage /></ProtectedRoute>} />
          <Route path="/paper/:id" element={<ProtectedRoute><PaperDetailPage /></ProtectedRoute>} />
        </Routes>
      </ToastProvider>
    </Router>
  );
}
