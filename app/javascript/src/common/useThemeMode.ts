import React from "react";

const getThemeMode = (): "light" | "dark" =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

const useThemeMode = () => {
  const [themeMode, setThemeMode] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const syncThemeMode = () => setThemeMode(getThemeMode());

    syncThemeMode();

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
