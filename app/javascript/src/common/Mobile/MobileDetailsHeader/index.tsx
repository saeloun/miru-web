import React from "react";

import { X } from "phosphor-react";
import { Link } from "react-router-dom";

export const MobileDetailsHeader = ({
  wrapperClassName = "sticky top-0 z-20 flex h-14 w-full items-center justify-center border-b border-border bg-background/95 px-4 text-foreground backdrop-blur",
  title = "",
  href,
}) => (
  <div className={wrapperClassName}>
    <span className="text-sm font-semibold">{title}</span>
    <div className="absolute right-4 flex items-center">
      <Link to={href}>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground">
          <X className="h-4 w-4" />
        </span>
      </Link>
    </div>
  </div>
);
