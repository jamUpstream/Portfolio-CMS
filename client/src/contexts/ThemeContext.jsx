import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { applyCachedAdminTheme } from '../lib/adminTheme';

const ThemeContext = createContext(null);

function getInitialMode() {
  const stored = localStorage.getItem('theme-mode');
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    localStorage.setItem('theme-mode', mode);
    applyCachedAdminTheme(mode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggleMode: () => setMode((current) => (current === 'dark' ? 'light' : 'dark'))
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
