import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system" | "monochrome";
type LayoutMode = "classic" | "modern";

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  systemTheme: "light" | "dark";
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};

// Optional version that returns null instead of throwing
export const useThemeOptional = () => {
  const context = useContext(ThemeContext);

  return context || null;
};

// Cookie utilities
const setCookie = (name: string, value: string, days: number = 365) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }

  return null;
};

// Storage utilities that try both localStorage and cookies
const getStoredValue = (key: string, fallback: string): string => {
  try {
    // Try localStorage first
    const localValue = localStorage.getItem(key);
    if (localValue) return localValue;

    // Fallback to cookies
    const cookieValue = getCookie(key);
    if (cookieValue) return cookieValue;

    return fallback;
  } catch (error) {
    // If localStorage is not available, try cookies
    const cookieValue = getCookie(key);

    return cookieValue || fallback;
  }
};

const setStoredValue = (key: string, value: string) => {
  try {
    // Store in localStorage
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn("localStorage not available, falling back to cookies");
  }

  // Always store in cookies as backup
  setCookie(key, value);
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultLayoutMode?: LayoutMode;
  storageKey?: string;
  layoutStorageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "system",
  defaultLayoutMode = "modern",
  storageKey = "miru-theme",
  layoutStorageKey = "miru-layout-mode",
}) => {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [layoutMode, setLayoutModeState] =
    useState<LayoutMode>(defaultLayoutMode);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
  const [isLoading, setIsLoading] = useState(true);

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light");
    };

    updateSystemTheme();
    mediaQuery.addEventListener("change", updateSystemTheme);

    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, []);

  // Load saved preferences on mount
  useEffect(() => {
    const savedTheme = getStoredValue(storageKey, defaultTheme);
    const savedLayoutMode = getStoredValue(layoutStorageKey, defaultLayoutMode);

    if (["light", "dark", "system", "monochrome"].includes(savedTheme)) {
      setThemeState(savedTheme as Theme);
    }

    if (["classic", "modern"].includes(savedLayoutMode)) {
      setLayoutModeState(savedLayoutMode as LayoutMode);
    }

    setIsLoading(false);
  }, [storageKey, layoutStorageKey, defaultTheme, defaultLayoutMode]);

  // Calculate effective theme
  const effectiveTheme =
    theme === "system"
      ? systemTheme
      : theme === "monochrome"
      ? "monochrome"
      : theme;

  // Apply theme to document
  useEffect(() => {
    if (isLoading) return;

    const root = window.document.documentElement;

    // Remove previous theme classes
    root.classList.remove("light", "dark", "monochrome");

    // Add current theme class
    root.classList.add(effectiveTheme);

    // Apply layout mode as data attribute
    root.setAttribute("data-layout-mode", layoutMode);

    // Apply theme to meta tag for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        effectiveTheme === "dark" ? "#1D1A31" : "#FFFFFF"
      );
    }

    // For better UX, also add theme to body for immediate visual feedback
    document.body.setAttribute("data-theme", effectiveTheme);
    document.body.setAttribute("data-layout-mode", layoutMode);
  }, [effectiveTheme, layoutMode, isLoading]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    setStoredValue(storageKey, newTheme);

    // Dispatch custom event for backward compatibility
    window.dispatchEvent(
      new CustomEvent("themeChanged", { detail: { theme: newTheme } })
    );
  };

  const setLayoutMode = (newMode: LayoutMode) => {
    setLayoutModeState(newMode);
    setStoredValue(layoutStorageKey, newMode);

    // Dispatch custom event for components that need to react to layout changes
    window.dispatchEvent(
      new CustomEvent("layoutModeChanged", { detail: { layoutMode: newMode } })
    );
  };

  const value: ThemeContextType = {
    theme,
    effectiveTheme,
    setTheme,
    layoutMode,
    setLayoutMode,
    systemTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
