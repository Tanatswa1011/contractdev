"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "cg-theme";

let currentTheme: Theme = "light";
const listeners = new Set<() => void>();

function getSnapshot(): Theme {
  return currentTheme;
}

function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function setThemeValue(value: Theme) {
  currentTheme = value;
  if (typeof document !== "undefined") {
    if (value === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, value);
  }
  listeners.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === "dark" || stored === "light") {
    currentTheme = stored;
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
    }
  }
}

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (next: Theme | ((prev: Theme) => Theme)) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme | ((prev: Theme) => Theme)) => {
    const value = typeof next === "function" ? next(currentTheme) : next;
    setThemeValue(value);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): [boolean, (value: boolean) => void] {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return [
      false,
      () => {},
    ];
  }
  const isDark = ctx.theme === "dark";
  const setDark = (dark: boolean) => ctx.setTheme(dark ? "dark" : "light");
  return [isDark, setDark];
}
