import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../lib/api';
import { applyAdminTheme } from '../lib/adminTheme';
import { applyPortfolioSettings } from '../lib/portfolioTheme';
import { useTheme } from '../contexts/ThemeContext';

export default function Login() {
  const { signIn, session, signOut } = useAuth();
  const { mode } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/site-settings', { cache: 'no-store' }).then((settings) => {
      if (cancelled) return;
      setSiteSettings(settings);
    }).catch(() => {
      if (cancelled) return;
      setSiteSettings({});
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const settings = siteSettings ?? {};
    applyAdminTheme(settings, mode);
    applyPortfolioSettings(settings, mode, settings.site_title || 'Portfolio CMS');
  }, [siteSettings, mode]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    navigate('/admin');
  }

  async function handleSignOut() {
    setLoggingOut(true);
    await signOut();
    setLoggingOut(false);
    setLogoutOpen(false);
  }

  return (
    <main className="login-page">
      <form onSubmit={handleSubmit} className="login-card">
        <div className="login-heading">
          <span className="login-icon">
            <LockKeyhole className="h-5 w-5" />
          </span>
          <div>
            <h1>Admin login</h1>
            <p>Enter the CMS credentials to continue.</p>
          </div>
        </div>
        {session ? (
          <div className="login-session">
            <div className="login-session-copy">
              <span>Signed in as</span>
              <strong>{session.user.email}</strong>
            </div>
            <div className="login-session-actions">
              <Link to="/admin">Continue</Link>
              <button type="button" onClick={() => setLogoutOpen(true)}>Sign out</button>
            </div>
          </div>
        ) : null}
        <label className="login-field">
          <span>Email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@panel.com" autoComplete="email" required />
        </label>
        <label className="login-field">
          <span>Password</span>
          <div className="login-password">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" autoComplete="current-password" required />
            <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
        <button className="button login-submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <ConfirmDialog
        open={logoutOpen}
        title="Log out?"
        description="Your current admin session will be cleared from this browser."
        confirmLabel="Log out"
        loading={loggingOut}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={handleSignOut}
      />
    </main>
  );
}
