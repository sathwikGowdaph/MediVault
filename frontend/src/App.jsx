import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Immediate layout and core pages
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Lazy-loaded page components for bundle optimization
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const RecordsPage = lazy(() => import('./pages/RecordsPage'));
const EmergencyPage = lazy(() => import('./pages/EmergencyPage'));
const FamilyPage = lazy(() => import('./pages/FamilyPage'));
const RemindersPage = lazy(() => import('./pages/RemindersPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const DoctorAccessPage = lazy(() => import('./pages/DoctorAccessPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

/** Redirects unauthenticated users to /login */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, ready } = useAuth();
  if (!ready) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><LoadingSpinner /></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

/** Redirects users without the required role to /dashboard */
const RoleRoute = ({ children, role }) => {
  const { isAuthenticated, user, ready } = useAuth();
  if (!ready) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><LoadingSpinner /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
};

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      <p className="text-sm font-medium text-slate-500">Loading MediVault…</p>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><LoadingSpinner /></div>}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Doctor emergency access — public but token-gated */}
        <Route path="/emergency/access/:token" element={<DoctorAccessPage />} />

        {/* Protected dashboard */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
        >
          <Route index element={<OverviewPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="records" element={<RecordsPage />} />
          <Route path="emergency" element={<EmergencyPage />} />
          <Route path="family" element={<FamilyPage />} />
          <Route path="reminders" element={<RemindersPage />} />
          <Route path="admin" element={<RoleRoute role="admin"><AdminPage /></RoleRoute>} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
