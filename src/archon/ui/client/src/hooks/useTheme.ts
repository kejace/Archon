import { useCallback, useEffect, useState } from 'react';

/**
 * Light/dark theme state for the dashboard.
 *
 * Precedence: an explicit user choice in localStorage wins; otherwise we
 * follow the OS `prefers-color-scheme`. The resolved theme is written to
 * `<html data-theme>`, which `global.css` keys its dark palette off of.
 * (The initial paint is handled by the inline bootstrap in index.html so
 * there's no flash; this hook keeps React in sync and persists changes.)
 */

const STORAGE_KEY = 'archon-theme';

export type Theme = 'light' | 'dark';

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readStored(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

function resolveInitial(): Theme {
  return readStored() ?? (systemPrefersDark() ? 'dark' : 'light');
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(resolveInitial);

  // Reflect the current theme onto <html> for the CSS to pick up.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Follow the OS setting until the user makes an explicit choice.
  useEffect(() => {
    if (readStored()) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* private mode / storage disabled — theme still applies for the session */
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
