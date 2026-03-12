"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "cg-theme";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (next: Theme | ((prev: Theme) => Theme)) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY)) as Theme | null;
    const initial = stored ?? "light";
    setThemeState(initial);
    if (initial === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const setTheme = useCallback((next: Theme | ((prev: Theme) => Theme)) => {
    setThemeState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      if (value === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, value);
      return value;
    });
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
