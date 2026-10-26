import React, { useEffect, useRef, useState } from "react";
import { CaretDown } from "phosphor-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandInput, CommandItem, CommandList } from "../ui/command";
import { failureMessage, read } from "./api";
import {
  receiptLabel,
  type Application,
  type Choice,
  type Mailbox,
  type Pagination,
  type Role,
} from "./types";

type Choices = {
  company_id: number;
  roles?: Role[];
  templates?: { id: number; title: string }[];
  mailboxes?: Mailbox[];
  applications?: Application[];
  time_zone?: string;
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
  kind:
    | "roles"
    | "owners"
    | "mailboxes"
    | "applications"
    | "assignment_templates";
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
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const searchLabel =
    kind === "assignment_templates"
      ? "Search approved tasks"
      : `Search ${kind}`;

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
          status:
            kind === "assignment_templates"
              ? "approved"
              : kind === "roles" && purpose === "intake"
              ? "open"
              : undefined,
          include_history:
            kind === "owners" && purpose === "history" ? true : undefined,
          active:
            kind === "mailboxes" && purpose === "intake" ? true : undefined,
        },
        controller.signal
      )
        .then(data => {
          if (!active) return;
          let choices: Choice[];
          if (kind === "assignment_templates") {
            choices = (data.templates || []).map(task => ({
              id: task.id,
              label: task.title,
            }));
          } else if (kind === "roles") {
            choices = (data.roles || []).map(role => ({
              id: role.id,
              label: `${role.title}${
                role.status === "closed" ? " (closed)" : ""
              }`,
            }));
          } else if (kind === "owners") {
            choices = (data.owners || []).map(owner => ({
              id: owner.id,
              label: `${owner.full_name}${
                owner.employee_id ? ` · ${owner.employee_id}` : ""
              }${owner.active ? "" : " (former)"}`,
            }));
          } else if (kind === "mailboxes") {
            choices = (data.mailboxes || []).map(mailbox => ({
              id: mailbox.id,
              label: `${mailbox.name} · ${mailbox.source_email}${
                mailbox.active ? "" : " (disabled)"
              }`,
            }));
          } else {
            choices = (data.applications || []).map(application => ({
              id: application.id,
              label: `${application.candidate.full_name} · ${
                application.candidate.email
              } · ${application.role?.title || "No role"} · ${receiptLabel(
                application.received_at,
                data.time_zone || "UTC"
              )}`,
            }));
          }

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

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  const choose = (choice: Choice | null) => {
    change(choice);
    close();
  };

  return (
    <div className="min-w-0 space-y-2">
      <Label id={`${id}-label`}>{label}</Label>
      <Popover open={open} onOpenChange={changeOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={trigger}
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
          className="w-[min(22rem,calc(100vw-2rem))] p-0 data-[state=closed]:hidden"
          align="start"
          onEscapeKeyDown={event => {
            event.preventDefault();
            close();
          }}
          onCloseAutoFocus={event => event.preventDefault()}
        >
          <Command shouldFilter={false}>
            <CommandInput
              ref={search}
              aria-label={searchLabel}
              placeholder={searchLabel}
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
          </Command>
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
                onClick={() => {
                  setRetry(retry + 1);
                  search.current?.focus();
                }}
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
                onClick={() => {
                  setPage(page + 1);
                  search.current?.focus();
                }}
              >
                Load more
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
