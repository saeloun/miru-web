import React from "react";
import { Moon, Sun } from "phosphor-react";
import { useLocale } from "../../context/LocaleContext";
import { i18n } from "../../i18n";

const STORAGE_KEY = "miru-theme";

const getInitialTheme = (): "light" | "dark" => {
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

type ThemeToggleProps = {
  className?: string;
  compact?: boolean;
};

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  compact,
}) => {
  const { locale } = useLocale();
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      data-locale={locale}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground ${className}`}
      aria-label={i18n.t("switchToMode", {
        mode: i18n.t(theme === "dark" ? "light" : "dark").toLowerCase(),
      })}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      {!compact && <span>{i18n.t(theme === "dark" ? "light" : "dark")}</span>}
    </button>
  );
};

export default ThemeToggle;
