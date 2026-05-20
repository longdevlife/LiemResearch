import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { LoginPage } from './pages/LoginPage';
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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/my-requests" element={<MyRequestsPage />} />
        <Route path="/rankings" element={<UserRankingPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/request-paper" element={<RequestPaperPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/papers" element={<PaperManagementPage />} />
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/paper/:id" element={<PaperDetailPage />} />
      </Routes>
    </Router>
  );
}