import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Award,
  BriefcaseBusiness,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileUp,
  GraduationCap,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  Menu,
  Moon,
  Palette,
  PanelsTopLeft,
  ServerCog,
  Settings,
  Star,
  Sun,
  UserRound,
  Wrench,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import ResumeImportModal from '../../components/ResumeImportModal';
import { api } from '../../lib/api';
import { applyDocumentHead } from '../../lib/documentHead';
import { applyAdminTheme } from '../../lib/adminTheme';

const nav = [
  ['Dashboard', '/admin', LayoutDashboard],
  ['Preview', '/admin/preview', Eye],
  ['Profile', '/admin/profile', UserRound],
  ['Projects', '/admin/projects', PanelsTopLeft],
  ['Experience', '/admin/experience', BriefcaseBusiness],
  ['Education', '/admin/education', GraduationCap],
  ['Certificates', '/admin/certificates', Award],
  ['Skills', '/admin/skills', Wrench],
  ['Services', '/admin/services', ServerCog],
  ['Testimonials', '/admin/testimonials', Star],
  ['Social Links', '/admin/social-links', LinkIcon],
  ['Site Settings', '/admin/settings', Palette]
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const { mode, toggleMode } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('admin-sidebar-collapsed') === 'true');
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/site-settings')
      .then((settings) => {
        applyDocumentHead(settings, 'Portfolio CMS');
        applyAdminTheme(settings, mode);
      })
      .catch(() => {
        applyDocumentHead({}, 'Portfolio CMS');
        applyAdminTheme({}, mode);
      });
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!accountOpen && !mobileAccountOpen) return undefined;

    function closeAccountMenu(event) {
      if (event.target.closest?.('.admin-account')) return;
      setAccountOpen(false);
      setMobileAccountOpen(false);
    }

    window.addEventListener('mousedown', closeAccountMenu);
    return () => window.removeEventListener('mousedown', closeAccountMenu);
  }, [accountOpen, mobileAccountOpen]);

  async function logout() {
    setLoggingOut(true);
    await signOut();
    setLoggingOut(false);
    setLogoutOpen(false);
    navigate('/');
  }

  function requestLogout() {
    setAccountOpen(false);
    setMobileAccountOpen(false);
    setLogoutOpen(true);
  }

  function AccountMenu({ mobile = false } = {}) {
    const open = mobile ? mobileAccountOpen : accountOpen;
    const setOpen = mobile ? setMobileAccountOpen : setAccountOpen;

    return (
      <div className={`admin-account ${mobile ? 'mobile' : ''}`}>
        <button
          className="admin-account-button"
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <span className="admin-account-mark"><UserRound className="h-4 w-4" /></span>
          <span className="admin-account-copy">
            <strong>Admin Panel</strong>
            <small>{user?.email}</small>
          </span>
          <ChevronDown className="admin-account-chevron h-4 w-4" />
        </button>
        {open ? (
          <div className="admin-account-popover" role="menu">
            <div className="admin-account-popover-head">
              <span className="admin-account-mark large"><UserRound className="h-5 w-5" /></span>
              <strong>Admin Panel</strong>
              <small>{user?.email}</small>
            </div>
            <NavLink to="/admin/settings" className="admin-account-menu-item" onClick={() => setOpen(false)} role="menuitem">
              <Settings className="h-4 w-4" />
              Site settings
            </NavLink>
            <button className="admin-account-menu-item" type="button" onClick={requestLogout} role="menuitem">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`admin-shell admin-style-default ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="admin-sidebar">
        <AccountMenu />
        <nav className="admin-sidebar-nav">
          {nav.map(([label, to, Icon]) => (
            <NavLink key={to} to={to} end={to === '/admin'} title={sidebarCollapsed ? label : undefined} className={({ isActive }) => `admin-nav ${isActive ? 'active' : ''}`}>
              <Icon className="h-4 w-4" />
              <span className="admin-nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          className="admin-sidebar-collapse"
          type="button"
          onClick={() => setSidebarCollapsed((current) => !current)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          <span>{sidebarCollapsed ? 'Expand' : 'Collapse'}</span>
        </button>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar">
          <button className="icon-button admin-menu-button" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Toggle admin menu" aria-expanded={mobileMenuOpen}>
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <span className="admin-mobile-title">Admin Panel</span>
          <button className="icon-button admin-import-button" type="button" onClick={() => setImportOpen(true)} title="Import Resume" aria-label="Import Resume">
            <FileUp className="h-4 w-4" />
          </button>
          <button className="icon-button" onClick={toggleMode} aria-label="Toggle dark mode">
            {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </header>
        <div className={`admin-mobile-drawer-layer ${mobileMenuOpen ? 'open' : ''}`} aria-hidden={!mobileMenuOpen}>
          <button className="admin-drawer-backdrop" type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close admin menu" />
          <nav className="admin-mobile-menu" aria-label="Admin navigation">
            <div className="admin-drawer-head">
              <AccountMenu mobile />
              <button className="icon-button" type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close admin menu">
                <X className="h-4 w-4" />
              </button>
            </div>
            {nav.map(([label, to, Icon]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/admin'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `admin-nav ${isActive ? 'active' : ''}`}
              >
                <Icon className="h-4 w-4" />
                <span className="admin-nav-label">{label}</span>
              </NavLink>
            ))}
            <button className="admin-nav admin-mobile-import" type="button" onClick={() => {
              setMobileMenuOpen(false);
              setImportOpen(true);
            }}>
              <FileUp className="h-4 w-4" />
              <span className="admin-nav-label">Import Resume</span>
            </button>
          </nav>
        </div>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
      <ConfirmDialog
        open={logoutOpen}
        title="Log out?"
        description="You will leave the admin panel and need to sign in again to make changes."
        confirmLabel="Log out"
        loading={loggingOut}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={logout}
      />
      <ResumeImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
