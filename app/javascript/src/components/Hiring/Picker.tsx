import React, { useEffect, useState } from "react";
import { CaretDown } from "phosphor-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandInput, CommandItem, CommandList } from "../ui/command";
import { failureMessage, read } from "./api";
import type { Choice, Pagination, Role } from "./types";

type Choices = {
  company_id: number;
  roles?: Role[];
  owners?: {
    id: number;
    full_name: string;
    employee_id: string | null;
    active: boolean;
  }[];
  pagination: Pagination;
};

export default function Picker({
  id,
  label,
  companyId,
  kind,
  value,
  change,
  emptyLabel,
  purpose,
}: {
  id: string;
  label: string;
  companyId: number;
  kind: "roles" | "owners";
  value: Choice | null;
  change: (value: Choice | null) => void;
  emptyLabel: string;
  purpose: "intake" | "history";
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [options, setOptions] = useState<Choice[]>([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const controller = new window.AbortController();
    setLoading(true);
    setError("");
    if (page === 1) setOptions([]);
    const timer = setTimeout(() => {
      read<Choices>(
        kind,
        companyId,
        {
          query,
          page,
          status: kind === "roles" && purpose === "intake" ? "open" : undefined,
          include_history:
            kind === "owners" && purpose === "history" ? true : undefined,
        },
        controller.signal
      )
        .then(data => {
          if (!active) return;
          const choices =
            kind === "roles"
              ? (data.roles || []).map(role => ({
                  id: role.id,
                  label: `${role.title}${
                    role.status === "closed" ? " (closed)" : ""
                  }`,
                }))
              : (data.owners || []).map(owner => ({
                  id: owner.id,
                  label: `${owner.full_name}${
                    owner.employee_id ? ` · ${owner.employee_id}` : ""
                  }${owner.active ? "" : " (former)"}`,
                }));

          setOptions(previous =>
            page === 1 ? choices : [...previous, ...choices]
          );
          setMore(data.pagination.has_more);
          setLoading(false);
        })
        .catch(failure => {
          if (active) {
            setError(failureMessage(failure));
            setLoading(false);
          }
        });
    }, 200);

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [open, kind, companyId, query, page, retry, purpose]);

  const changeOpen = (next: boolean) => {
    if (next) setPage(1);
    setOpen(next);
  };

  const choose = (choice: Choice | null) => {
    change(choice);
    setOpen(false);
  };

  return (
    <div className="min-w-0 space-y-2">
      <Label id={`${id}-label`}>{label}</Label>
      <Popover open={open} onOpenChange={changeOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-labelledby={`${id}-label ${id}-value`}
            className="h-11 w-full justify-between text-left font-normal"
            onKeyDown={event => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                changeOpen(true);
              }
            }}
          >
            <span id={`${id}-value`} className="truncate">
              {value?.label || emptyLabel}
            </span>
            <CaretDown className="ml-2 h-4 w-4 shrink-0" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(22rem,calc(100vw-2rem))] p-0"
          align="start"
          onCloseAutoFocus={event => {
            const active = document.activeElement;
            // Preserve focus moved to another field while this picker closes.
            if (
              active &&
              active !== document.body &&
              active !== document.documentElement &&
              event.target instanceof HTMLElement &&
              !event.target.contains(active)
            ) {
              event.preventDefault();
            }
          }}
        >
          <Command shouldFilter={false}>
            <CommandInput
              aria-label={`Search ${kind}`}
              placeholder={`Search ${kind}`}
              value={query}
              onValueChange={next => {
                setQuery(next);
                setPage(1);
              }}
            />
            <CommandList aria-label={label}>
              {options.map(option => (
                <CommandItem
                  key={option.id}
                  value={String(option.id)}
                  className="min-h-11 break-words"
                  onSelect={() => choose(option)}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandList>
            {loading && (
              <p
                role="status"
                className="px-3 py-2 text-sm text-muted-foreground"
              >
                Loading…
              </p>
            )}
            {!loading && !error && options.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No matches.
              </p>
            )}
            {error && (
              <p role="alert" className="px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2 border-t p-2">
              <Button
                type="button"
                variant="ghost"
                className="min-h-11"
                onClick={() => choose(null)}
              >
                {emptyLabel}
              </Button>
              {error && (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => setRetry(retry + 1)}
                >
                  Retry
                </Button>
              )}
              {more && !error && (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={loading}
                  onClick={() => setPage(page + 1)}
                >
                  Load more
                </Button>
              )}
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
