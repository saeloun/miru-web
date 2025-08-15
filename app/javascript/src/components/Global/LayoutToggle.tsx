import React from "react";
import { Button } from "../ui/button";
import { LayoutDashboard, LayoutGrid } from "lucide-react";
import { useThemeOptional } from "contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const LayoutToggle: React.FC = () => {
  const themeContext = useThemeOptional();

  if (!themeContext) return null;

  const { layoutMode, setLayoutMode } = themeContext;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          title="Toggle layout mode"
        >
          {layoutMode === "modern" ? (
            <LayoutGrid className="h-4 w-4" />
          ) : (
            <LayoutDashboard className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle layout mode</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        <DropdownMenuItem
          onClick={() => setLayoutMode("modern")}
          className="flex items-center gap-2"
        >
          <LayoutGrid className="h-4 w-4" />
          <span>Modern Layout</span>
          {layoutMode === "modern" && (
            <span className="ml-auto text-xs text-muted-foreground">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLayoutMode("classic")}
          className="flex items-center gap-2"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Classic Layout</span>
          {layoutMode === "classic" && (
            <span className="ml-auto text-xs text-muted-foreground">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1 text-xs text-muted-foreground">
          Current: {layoutMode === "modern" ? "Modern" : "Classic"}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LayoutToggle;
