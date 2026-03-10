import React from "react";
import { CircleNotch } from "@phosphor-icons/react";
import { cn } from "../../lib/utils";

export type LoaderSize = "sm" | "md" | "lg";

interface LoaderProps {
  className?: string;
  message?: string;
  size?: LoaderSize;
  overlay?: boolean;
}

const sizeMap = {
  sm: {
    panel: "max-w-xs px-5 py-4",
    icon: "h-5 w-5",
  },
  md: {
    panel: "max-w-sm px-6 py-5",
    icon: "h-6 w-6",
  },
  lg: {
    panel: "max-w-md px-7 py-6",
    icon: "h-7 w-7",
  },
};

const Loader = ({
  className = "",
  message = "Loading workspace...",
  size = "md",
  overlay = true,
}: LoaderProps) => (
  <div
    className={cn(
      "flex min-h-screen w-full items-center justify-center bg-background text-foreground",
      overlay
        ? "fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-background/70 px-4 py-8 backdrop-blur-sm"
        : "px-4 py-10",
      className
    )}
  >
    <div
      className={cn(
        "w-full rounded-2xl border border-border bg-card/95 shadow-lg backdrop-blur",
        sizeMap[size].panel
      )}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <CircleNotch
          className={cn("animate-spin text-primary", sizeMap[size].icon)}
          weight="bold"
        />
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  </div>
);

export default Loader;
