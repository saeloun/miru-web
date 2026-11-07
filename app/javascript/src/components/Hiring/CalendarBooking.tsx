import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { failureMessage, quiet, read, verifyWorkspace } from "./api";
import type { ApplicationChange } from "./types";

type Event = {
  id: string;
  etag: string;
  summary: string;
  starts_at: string;
  ends_at: string;
};
type Page = {
  company_id: number;
  connected: boolean;
  reason?: "unconfigured" | "disconnected";
  application_version: number;
  interview_version: number;
  calendars?: { id: string; name: string }[];
  events?: Event[];
  next_page_token?: string;
};
type Draft = {
  event: Event;
  applicationVersion: number;
  interviewVersion: number;
  key: string;
  zone: string;
  hours: string;
  instructions: string;
  reason: string;
};

export default function CalendarBooking({
  companyId,
  applicationId,
  interviewId,
  currentBookingId,
  candidateZone,
  saved,
  failed,
  close,
}: {
  companyId: number;
  applicationId: number;
  interviewId: number;
  currentBookingId: number | null;
  candidateZone: string | null;
  saved: (application: ApplicationChange) => void;
  failed: (failure: unknown) => void;
  close: () => void;
}) {
  const [calendars, setCalendars] = useState<Page | null>(null);
  const [events, setEvents] = useState<Page | null>(null);
  const [calendar, setCalendar] = useState("");
  const [from, setFrom] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  const generation = useRef(0);
  const request = useRef<InstanceType<typeof window.AbortController> | null>(
    null
  );
  const feedback = useRef<HTMLParagraphElement>(null);
  const path = `applications/${applicationId}/interviews/${interviewId}`;

  const denied = (failure: unknown) => {
    setError(failureMessage(failure));
    if (
      axios.isAxiosError(failure) &&
      [403, 404].includes(failure.response?.status ?? 0)
    ) {
      setCalendars(null);
      setEvents(null);
      setDraft(null);
      failed(failure);
    }
  };

  const query = async (kind: "calendars" | "events", cursor?: string) => {
    const current = ++generation.current;
    request.current?.abort();
    request.current = new window.AbortController();
    setBusy(true);
    setError("");
    setDraft(null);
    if (kind === "events") setEvents(null);
    else {
      setCalendars(null);
      setCalendar("");
      setEvents(null);
    }
    try {
      const result = await read<Page>(
        `${path}/calendar_events`,
        companyId,
        {
          page_token: cursor,
          ...(kind === "events" ? { calendar_id: calendar, from } : {}),
        },
        request.current.signal
      );
      if (!mounted.current || current !== generation.current) return;

      if (kind === "calendars" || !result.connected) setCalendars(result);
      else setEvents(result);
    } catch (failure) {
      if (mounted.current && current === generation.current) denied(failure);
    } finally {
      if (mounted.current && current === generation.current) setBusy(false);
    }
  };

  useEffect(() => {
    mounted.current = true;
    query("calendars");

    return () => {
      mounted.current = false;
      generation.current += 1;
      request.current?.abort();
    };
  }, [companyId, path]);

  useEffect(() => {
    if (error) feedback.current?.focus();
  }, [error]);

  const importEvent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await Api.post(
        `/hiring/${path}/bookings/import`,
        {
          hiring_booking: {
            company_id: companyId,
            application_version: draft.applicationVersion,
            interview_version: draft.interviewVersion,
            request_key: draft.key,
            calendar_id: calendar,
            event_id: draft.event.id,
            etag: draft.event.etag,
            candidate_time_zone: draft.zone,
            feedback_hours: Number(draft.hours),
            booking_instructions: draft.instructions,
            previous_booking_id: currentBookingId,
            reason: draft.reason,
          },
        },
        quiet
      );
      verifyWorkspace(response.data, companyId);
      if (mounted.current) saved(response.data.application);
    } catch (failure) {
      if (mounted.current) denied(failure);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const connect = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await Api.get("/calendars/redirect", {
        ...quiet,
        params: { return_to: `/hiring/applications/${applicationId}` },
      });
      if (!mounted.current) return;
      const destination = new URL(response.data.url);
      if (destination.origin !== "https://accounts.google.com") {
        throw new Error("Invalid calendar authorization URL");
      }
      window.location.assign(destination.toString());
    } catch (failure) {
      if (mounted.current) {
        denied(failure);
        setBusy(false);
      }
    }
  };

  return (
    <section
      aria-label="Calendar import"
      className="min-w-0 space-y-4 rounded-lg border p-4"
    >
      <h5 className="font-semibold">Import a Google Calendar meeting</h5>
      <p className="text-sm text-muted-foreground">
        Import an existing event containing the candidate and every assigned
        interviewer. This does not change Google Calendar or send an invitation.
      </p>
      {error && (
        <p ref={feedback} role="alert" tabIndex={-1}>
          {error}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={busy && !!draft}
        onClick={close}
      >
        Close calendar import
      </Button>
      {calendars && !calendars.connected && (
        <div className="space-y-3">
          <p>
            {calendars.reason === "unconfigured"
              ? "Google Calendar is not configured for Miru."
              : "Connect your own Google Calendar to import meetings."}{" "}
            You can still record a manual booking.
          </p>
          {calendars.reason === "disconnected" && (
            <Button
              type="button"
              className="min-h-11"
              disabled={busy}
              onClick={connect}
            >
              Connect Google Calendar
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={busy}
            onClick={() => query("calendars")}
          >
            Check calendar connection
          </Button>
        </div>
      )}
      {calendars?.connected && (
        <>
          <form
            onSubmit={event => {
              event.preventDefault();
              query("events");
            }}
          >
            <fieldset disabled={busy || !!draft} className="min-w-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="calendar-id">Google calendar</Label>
                <select
                  id="calendar-id"
                  required
                  className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                  value={calendar}
                  onChange={event => {
                    setCalendar(event.target.value);
                    setEvents(null);
                  }}
                >
                  <option value="">Choose a calendar</option>
                  {calendars.calendars?.map(row => (
                    <option key={row.id} value={row.id}>
                      {row.name || row.id}
                    </option>
                  ))}
                </select>
                {calendars.next_page_token && (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={() =>
                      query("calendars", calendars.next_page_token)
                    }
                  >
                    More calendars
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => query("calendars")}
                >
                  First calendar page
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="calendar-from">Search from (UTC date)</Label>
                <Input
                  id="calendar-from"
                  type="date"
                  required
                  className="h-11"
                  value={from}
                  onChange={event => {
                    setFrom(event.target.value);
                    setEvents(null);
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Searches seven UTC days at a time. Only events matching the
                candidate, panel and configured round duration appear. Email
                addresses must match; aliases are not inferred.
              </p>
              <Button type="submit" className="min-h-11">
                Find matching events
              </Button>
            </fieldset>
          </form>
          {events && (
            <div className="space-y-3">
              <Label htmlFor="calendar-event">Calendar event</Label>
              <select
                id="calendar-event"
                disabled={busy || !!draft}
                className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                value={draft?.event.id || ""}
                onChange={event => {
                  const selected = events.events?.find(
                    row => row.id === event.target.value
                  );
                  if (selected) {
                    setDraft({
                      event: selected,
                      applicationVersion: events.application_version,
                      interviewVersion: events.interview_version,
                      key: window.crypto.randomUUID(),
                      zone: candidateZone || "",
                      hours: "",
                      instructions: "",
                      reason: "",
                    });
                  }
                }}
              >
                <option value="">Choose a matching meeting</option>
                {events.events?.map(row => (
                  <option key={row.id} value={row.id}>
                    {row.summary || "Interview"} — {row.starts_at}
                  </option>
                ))}
              </select>
              {!events.events?.length && (
                <p>
                  No matching events on this page. Try another date or continue
                  to the next page.
                </p>
              )}
              {events.next_page_token && (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={busy || !!draft}
                  onClick={() => query("events", events.next_page_token)}
                >
                  More matching events
                </Button>
              )}
            </div>
          )}
          {draft && (
            <form onSubmit={importEvent} className="space-y-4">
              <fieldset disabled={busy} className="min-w-0 space-y-4">
                <legend className="mb-3 font-medium">
                  {currentBookingId
                    ? "Import a replacement booking"
                    : "Import selected meeting"}
                </legend>
                <p className="break-all text-sm">
                  UTC: {draft.event.starts_at} — {draft.event.ends_at}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="calendar-zone">
                    Candidate time zone for import
                  </Label>
                  <Input
                    id="calendar-zone"
                    className="h-11"
                    required
                    maxLength={100}
                    placeholder="Asia/Kolkata"
                    value={draft.zone}
                    onChange={event =>
                      setDraft({ ...draft, zone: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calendar-hours">
                    Feedback due within (hours after interview)
                  </Label>
                  <Input
                    id="calendar-hours"
                    className="h-11"
                    type="number"
                    min={1}
                    max={8760}
                    step={1}
                    required
                    value={draft.hours}
                    onChange={event =>
                      setDraft({ ...draft, hours: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calendar-instructions">
                    Booking instructions
                  </Label>
                  <Textarea
                    id="calendar-instructions"
                    maxLength={5000}
                    value={draft.instructions}
                    onChange={event =>
                      setDraft({ ...draft, instructions: event.target.value })
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Candidate-facing rescheduling and cancellation instructions.
                    Keep internal feedback separate.
                  </p>
                </div>
                {currentBookingId && (
                  <div className="space-y-2">
                    <Label htmlFor="calendar-reason">
                      Replacement reason (internal)
                    </Label>
                    <Textarea
                      id="calendar-reason"
                      required
                      maxLength={2000}
                      value={draft.reason}
                      onChange={event =>
                        setDraft({ ...draft, reason: event.target.value })
                      }
                    />
                  </div>
                )}
                <Button type="submit" className="min-h-11">
                  Import selected event
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => {
                    setDraft(null);
                    setEvents(null);
                    setError("");
                  }}
                >
                  Discard calendar draft and search again
                </Button>
              </fieldset>
            </form>
          )}
        </>
      )}
      {busy && <p role="status">Loading calendar…</p>}
    </section>
  );
}
