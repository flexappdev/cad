"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "cad:theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // Read initial theme from localStorage (or fallback to OS preference) once mounted
  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Theme | null;
    if (stored === "light" || stored === "dark") {
      apply(stored);
      setThemeState(stored);
      return;
    }
    const prefersDark =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const next: Theme = prefersDark ? "dark" : "light";
    apply(next);
    setThemeState(next);
  }, []);

  function apply(t: Theme) {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", t);
  }

  function setTheme(t: Theme) {
    apply(t);
    setThemeState(t);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, t);
  }

  function toggle() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Outside provider — return a no-op default. This is fine for SSR/static
    // pages that don't toggle theme.
    return {
      theme: "light",
      setTheme: () => undefined,
      toggle: () => undefined,
    };
  }
  return ctx;
}
