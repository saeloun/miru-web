import React from "react";
import { Button } from "../ui/button";
import type { Pagination } from "./types";

export default function Pager({
  pagination,
  change,
  disabled,
}: {
  pagination: Pagination;
  change: (page: number) => void;
  disabled: boolean;
}) {
  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-end gap-3 text-sm"
    >
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={disabled || pagination.page === 1}
        onClick={() => change(pagination.page - 1)}
      >
        Previous
      </Button>
      <span className="tabular-nums">Page {pagination.page}</span>
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={disabled || !pagination.has_more}
        onClick={() => change(pagination.page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
