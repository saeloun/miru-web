import React from "react";

const STORAGE_KEY = "miru-theme";

const getThemeMode = (): "light" | "dark" =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

const getInitialThemeMode = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";

  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const useThemeMode = () => {
  const [themeMode, setThemeMode] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const syncThemeMode = () => setThemeMode(getThemeMode());
    const initialThemeMode = getInitialThemeMode();

    document.documentElement.classList.toggle(
      "dark",
      initialThemeMode === "dark"
    );
    setThemeMode(initialThemeMode);

    const observer = new window.MutationObserver(syncThemeMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return themeMode;
};

export default useThemeMode;
