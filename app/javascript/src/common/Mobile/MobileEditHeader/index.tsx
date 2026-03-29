import React from "react";

import BackButton from "components/Invoices/Invoice/BackButton";
import { Link } from "react-router-dom";

export const MobileEditHeader = ({
  wrapperClassName = "sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-border bg-background/95 px-4 text-foreground backdrop-blur",
  title = "",
  backHref,
  href,
  showEdit = true,
}) => (
  <div className={wrapperClassName}>
    <div className="flex min-w-0 items-center gap-3">
      <BackButton href={backHref} />
      <span className="truncate text-sm font-semibold">{title}</span>
    </div>
    {showEdit && (
      <Link
        className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-accent"
        to={href}
      >
        Edit
      </Link>
    )}
  </div>
);
