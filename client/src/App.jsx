import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { resources } from './lib/resources';
import PortfolioHome from './pages/PortfolioHome';

const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Login = lazy(() => import('./pages/Login'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminResourcePage = lazy(() => import('./pages/admin/AdminResourcePage'));
const ProfilePage = lazy(() => import('./pages/admin/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const PreviewPage = lazy(() => import('./pages/admin/PreviewPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="screen-center">Loading session...</div>;
  return session ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<div className="screen-center">Loading page...</div>}>
      <Routes>
        <Route path="/" element={<PortfolioHome />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="preview" element={<PreviewPage />} />
          <Route path="profile" element={<ProfilePage />} />
          {Object.keys(resources).map((key) => (
            <Route key={key} path={key} element={<AdminResourcePage resourceKey={key} />} />
          ))}
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
