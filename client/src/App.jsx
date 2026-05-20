import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { resources } from './lib/resources';
import PortfolioHome from './pages/PortfolioHome';
import ProjectDetail from './pages/ProjectDetail';
import Login from './pages/Login';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminResourcePage from './pages/admin/AdminResourcePage';
import ProfilePage from './pages/admin/ProfilePage';
import SettingsPage from './pages/admin/SettingsPage';
import PreviewPage from './pages/admin/PreviewPage';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="screen-center">Loading session...</div>;
  return session ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
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
  );
}
