// Example usage of the theme toggle in your application
// You can integrate this into your Navbar or any component

import React from "react";
import { ModeToggle } from "./mode-toggle";
import { useTheme } from "./theme-provider";

export function ThemeExample() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="flex items-center gap-4">
      {/* Current theme indicator */}
      <span className="text-sm text-muted-foreground">
        Current theme: {theme}
      </span>
      
      {/* Theme toggle dropdown */}
      <ModeToggle />
      
      {/* Alternative: Simple toggle buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setTheme("light")}
          className="px-2 py-1 text-xs rounded border hover:bg-accent"
        >
          Light
        </button>
        <button
          onClick={() => setTheme("dark")}
          className="px-2 py-1 text-xs rounded border hover:bg-accent"
        >
          Dark
        </button>
        <button
          onClick={() => setTheme("system")}
          className="px-2 py-1 text-xs rounded border hover:bg-accent"
        >
          System
        </button>
      </div>
    </div>
  );
}

// Example of how to use in your existing components:
// 1. Add to your Navbar Header component:
/*
import { ModeToggle } from "../ui/mode-toggle";

// In your Header component JSX:
<div className="flex items-center gap-4">
  <ModeToggle />
</div>
*/

// 2. For custom styling with your existing Miru components:
/*
import { useTheme } from "../ui/theme-provider";

const CustomThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <button 
      className="menuButton__button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
};
*/