const adminThemeStorageKey = 'admin-theme-settings';

export function applyAdminTheme(settings = {}, mode = document.documentElement.dataset.theme || 'light', persist = true) {
  const isDark = mode === 'dark';
  const root = document.documentElement;
  const accent = settings.theme_primary_color || '#b45309';
  const background = isDark
    ? (settings.theme_dark_background_color || '#15130f')
    : (settings.theme_background_color || '#f6f0e7');
  const text = isDark
    ? (settings.theme_dark_text_color || '#f4eadc')
    : (settings.theme_text_color || '#1d1a16');
  const surface = isDark
    ? (settings.theme_dark_surface_color || '#1f1b17')
    : (settings.theme_surface_color || '#fffaf2');

  root.style.setProperty('--admin-theme-accent', accent);
  root.style.setProperty('--admin-theme-bg', background);
  root.style.setProperty('--admin-theme-text', text);
  root.style.setProperty('--admin-theme-panel', surface);
  root.style.setProperty('--admin-sidebar-active', accent);
  root.style.setProperty('--admin-sidebar-active-text', isDark ? '#fffaf2' : '#fffdf8');
  root.style.setProperty('--color-accent', accent);
  root.style.setProperty('--color-paper', background);
  root.style.setProperty('--color-ink', text);
  root.style.setProperty('--color-surface', surface);

  if (persist) {
    localStorage.setItem(adminThemeStorageKey, JSON.stringify(settings));
  }
}

export function applyCachedAdminTheme(mode = document.documentElement.dataset.theme || 'light') {
  try {
    const cached = JSON.parse(localStorage.getItem(adminThemeStorageKey) || '{}');
    applyAdminTheme(cached, mode, false);
  } catch {
    applyAdminTheme({}, mode, false);
  }
}
