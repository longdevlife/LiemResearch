import type React from 'react';
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { useLocation, useNavigate } from 'react-router';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';
import { UserDashboard } from './pages/UserDashboard';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { UserRankingPage } from './pages/UserRankingPage';
import { UserPublicProfilePage } from './pages/UserPublicProfilePage';
import { UserProfileSettingsPage } from './pages/UserProfileSettingsPage';
import { RequestPaperPage } from './pages/RequestPaperPage';
import { AdminBrowseDashboard } from './pages/AdminBrowseDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminProfilePage } from './pages/AdminProfilePage';
import { PaperManagementPage } from './pages/PaperManagementPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { PaperDetailPage } from './pages/PaperDetailPage';
import { AUTH_CHANGED_EVENT, clearAuth, getStoredUser, getToken } from './lib/api';
import { ToastProvider } from './components/ToastProvider';

const LAST_PATH_KEY = 'last-pathname';
const PUBLIC_PATHS = new Set(['/', '/login', '/register']);

function AdminRouteGuard() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const lastPath = sessionStorage.getItem(LAST_PATH_KEY);
    const currentUser = getStoredUser();

    if (location.pathname === '/' && lastPath?.startsWith('/admin') && currentUser?.role === 'admin' && getToken()) {
      clearAuth();
      sessionStorage.removeItem(LAST_PATH_KEY);
      navigate('/login', { replace: true });
      return;
    }

    sessionStorage.setItem(LAST_PATH_KEY, location.pathname);
  }, [location.pathname, navigate]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem(LAST_PATH_KEY, location.pathname);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location.pathname]);

  return null;
}

function AuthSessionGuard() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthChanged = () => {
      if (!PUBLIC_PATHS.has(location.pathname) && (!getToken() || !getStoredUser())) {
        navigate('/login', { replace: true });
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'token' || event.key === 'user') {
        handleAuthChanged();
      }
    };

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
      window.removeEventListener('storage', handleStorage);
    };
  }, [location.pathname, navigate]);

  return null;
}

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
        <AdminRouteGuard />
        <AuthSessionGuard />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<ProtectedRoute role="user"><UserDashboard /></ProtectedRoute>} />
          <Route path="/my-requests" element={<ProtectedRoute role="user"><MyRequestsPage /></ProtectedRoute>} />
          <Route path="/rankings" element={<ProtectedRoute role="user"><UserRankingPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute role="user"><UserPublicProfilePage /></ProtectedRoute>} />
          <Route path="/profile/settings" element={<Navigate to="/settings/profile" replace />} />
          <Route path="/settings" element={<Navigate to="/settings/profile" replace />} />
          <Route path="/settings/:section" element={<ProtectedRoute role="user"><UserProfileSettingsPage /></ProtectedRoute>} />
          <Route path="/request-paper" element={<ProtectedRoute role="user"><RequestPaperPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminBrowseDashboard /></ProtectedRoute>} />
          <Route path="/admin/stats" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute role="admin"><AdminProfilePage /></ProtectedRoute>} />
          <Route path="/admin/papers" element={<ProtectedRoute role="admin"><PaperManagementPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="admin"><UserManagementPage /></ProtectedRoute>} />
          <Route path="/admin/post-paper" element={<ProtectedRoute role="admin"><RequestPaperPage role="admin" /></ProtectedRoute>} />
          <Route path="/paper/:id" element={<ProtectedRoute><PaperDetailPage /></ProtectedRoute>} />
        </Routes>
      </ToastProvider>
    </Router>
  );
}
