import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import Pager from "./Pager";
import CalendarBooking from "./CalendarBooking";
import InterviewMessages from "./InterviewMessages";
import {
  accessDenied,
  failureMessage,
  quiet,
  read,
  verifyWorkspace,
} from "./api";
import { stageLabel, type ApplicationChange } from "./types";
import {
  bookingTimeLabel,
  type Booking,
  type BookingPage,
} from "./bookingTypes";

type Draft = {
  action: "record" | "cancel" | "no_show";
  booking: Booking | null;
  applicationVersion: number;
  interviewVersion: number;
  requestKey: string;
  local: string;
  zone: string;
  offset: string;
  url: string;
  instructions: string;
  hours: string;
  reason: string;
};

export default function InterviewBookings({
  companyId,
  applicationId,
  interviewId,
  applicationVersion,
  changed,
  close,
  onDenied,
}: {
  companyId: number;
  applicationId: number;
  interviewId: number;
  applicationVersion: number;
  changed: (attributes: ApplicationChange) => void;
  close: () => void;
  onDenied: (failure: unknown) => void;
}) {
  const [data, setData] = useState<BookingPage | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [offsets, setOffsets] = useState<string[]>([]);
  const [calendar, setCalendar] = useState<{
    currentBookingId: number | null;
    zone: string | null;
  } | null>(null);
  const generation = useRef(0);
  const mounted = useRef(true);
  const feedback = useRef<HTMLParagraphElement>(null);
  const path = `applications/${applicationId}/interviews/${interviewId}/bookings`;
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (error || notice) feedback.current?.focus();
  }, [error, notice]);

  useEffect(() => {
    if (data && data.application.lock_version < applicationVersion) {
      setRefresh(value => value + 1);
    }
  }, [applicationVersion, data?.application.lock_version]);

  const failed = (failure: unknown) => {
    if (axios.isAxiosError(failure)) {
      if (accessDenied(failure)) {
        setData(null);
        setDraft(null);
        setCalendar(null);
        onDenied(failure);
      }
      const options = failure.response?.data?.offset_options;
      if (
        Array.isArray(options) &&
        options.every(value => typeof value === "string")
      ) {
        setOffsets(options);
      }
    }
    setError(failureMessage(failure));
  };

  useEffect(() => {
    let active = true;
    const controller = new window.AbortController();
    const current = generation.current;
    setLoading(true);
    setData(null);
    read<BookingPage>(path, companyId, { page }, controller.signal)
      .then(result => {
        if (active && current === generation.current) {
          setData(result);
          changed(result.application);
          setError("");
        }
      })
      .catch(failure => {
        if (active && current === generation.current) failed(failure);
      })
      .finally(() => {
        if (active && current === generation.current) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [companyId, path, page, refresh]);

  const begin = (
    booking: Booking | null,
    action: Draft["action"] = "record"
  ) => {
    if (!data) return;
    setError("");
    setNotice("");
    setOffsets([]);
    setDraft({
      action,
      booking,
      applicationVersion: data.application.lock_version,
      interviewVersion: data.interview.lock_version,
      requestKey: window.crypto.randomUUID(),
      local:
        booking?.details.source === "manual"
          ? booking.details.starts_local
          : "",
      zone:
        booking?.details.candidate_time_zone || data.candidate_time_zone || "",
      offset: booking?.details.utc_offset || "",
      url: booking?.details.meeting_url || "",
      instructions: booking?.details.booking_instructions || "",
      hours: booking ? String(booking.details.feedback_hours) : "",
      reason: "",
    });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft || loading || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const common = {
        company_id: companyId,
        application_version: draft.applicationVersion,
        interview_version: draft.interviewVersion,
      };

      const response =
        draft.action === "record"
          ? await Api.post(
              `/hiring/${path}`,
              {
                hiring_booking: {
                  ...common,
                  request_key: draft.requestKey,
                  previous_booking_id: draft.booking?.id ?? null,
                  starts_local: draft.local,
                  candidate_time_zone: draft.zone,
                  utc_offset: draft.offset || null,
                  meeting_url: draft.url,
                  booking_instructions: draft.instructions,
                  feedback_hours: Number(draft.hours),
                  reason: draft.reason,
                },
              },
              quiet
            )
          : await Api.patch(
              `/hiring/${path}/${draft.booking!.id}`,
              {
                hiring_booking: {
                  ...common,
                  booking_version: draft.booking!.lock_version,
                  action: draft.action,
                  reason: draft.reason,
                },
              },
              quiet
            );
      verifyWorkspace(response.data, companyId);
      if (!mounted.current) return;
      generation.current += 1;
      setData(null);
      setDraft(null);
      setOffsets([]);
      setNotice(
        draft.action === "record"
          ? "Booking recorded"
          : draft.action === "cancel"
          ? "Booking cancelled"
          : "No-show recorded"
      );
      changed(response.data.application);
      setPage(1);
      setRefresh(value => value + 1);
    } catch (failure) {
      if (mounted.current) failed(failure);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const editable =
    data?.interview.status === "planned" &&
    data.application.stage === "interview";
  const locked = busy || loading || !!draft || !!calendar;

  return (
    <section
      aria-label="Interview bookings"
      className="min-w-0 space-y-5 rounded-lg border bg-card p-4 sm:p-6"
    >
      <h4 className="text-lg font-semibold">
        {data
          ? `Bookings for round ${data.interview.number}`
          : "Interview bookings"}
      </h4>
      <p className="text-sm text-muted-foreground">
        Record the meeting in the candidate's time zone. Rescheduling preserves
        the original booking and requires a reason.
      </p>
      {(error || notice) && (
        <p ref={feedback} role={error ? "alert" : "status"} tabIndex={-1}>
          {error || notice}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {data && (
          <Button
            className="min-h-11"
            variant="outline"
            disabled={locked || !editable}
            onClick={() =>
              setCalendar({
                currentBookingId: data.current_booking_id,
                zone: data.candidate_time_zone,
              })
            }
          >
            Import from Google Calendar
          </Button>
        )}
        {data && !data.current_booking_id && (
          <Button
            className="min-h-11"
            disabled={locked || !editable}
            onClick={() => begin(null)}
          >
            Record manual booking
          </Button>
        )}
        <Button
          className="min-h-11"
          variant="outline"
          disabled={busy || !!calendar}
          onClick={() => {
            setDraft(null);
            setOffsets([]);
            setNotice("");
            setRefresh(value => value + 1);
          }}
        >
          {draft ? "Discard draft and reload bookings" : "Refresh bookings"}
        </Button>
        <Button
          className="min-h-11"
          variant="outline"
          disabled={busy || !!calendar}
          onClick={close}
        >
          {draft
            ? "Discard draft and close booking history"
            : "Close booking history"}
        </Button>
      </div>
      {calendar && (
        <CalendarBooking
          companyId={companyId}
          applicationId={applicationId}
          interviewId={interviewId}
          currentBookingId={calendar.currentBookingId}
          candidateZone={calendar.zone}
          close={() => setCalendar(null)}
          failed={failed}
          saved={application => {
            generation.current += 1;
            setCalendar(null);
            setData(null);
            setNotice("Calendar booking imported");
            changed(application);
            setPage(1);
            setRefresh(value => value + 1);
          }}
        />
      )}
      {draft && (
        <form onSubmit={save} className="space-y-4 rounded-lg border p-4">
          <fieldset
            disabled={busy || loading || !editable}
            className="min-w-0 space-y-4"
          >
            <legend className="mb-3 font-medium">
              {draft.action === "record"
                ? draft.booking
                  ? "Reschedule booking"
                  : "Record a manual booking"
                : draft.action === "cancel"
                ? "Cancel booking"
                : "Record a no-show"}
            </legend>
            {draft.action === "record" &&
              draft.booking?.details.source === "google_calendar" && (
                <p className="text-sm text-muted-foreground">
                  Choose a new local time for this manual replacement. The
                  imported event keeps its original seconds and precision.
                </p>
              )}
            {draft.action === "record" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="booking-local">
                    Start in candidate's local time
                  </Label>
                  <Input
                    id="booking-local"
                    className="h-11"
                    type="datetime-local"
                    required
                    value={draft.local}
                    onChange={event => {
                      setOffsets([]);
                      setDraft({
                        ...draft,
                        local: event.target.value,
                        offset: "",
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-zone">Candidate time zone</Label>
                  <Input
                    id="booking-zone"
                    className="h-11"
                    required
                    maxLength={100}
                    placeholder="Asia/Kolkata"
                    value={draft.zone}
                    onChange={event => {
                      setOffsets([]);
                      setDraft({
                        ...draft,
                        zone: event.target.value,
                        offset: "",
                      });
                    }}
                  />
                  <p className="text-sm text-muted-foreground">
                    Use an IANA time zone, for example Asia/Kolkata or
                    Europe/London. We use the submitted candidate zone when
                    available.
                  </p>
                </div>
                {offsets.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="booking-offset">
                      UTC offset for repeated time
                    </Label>
                    <select
                      id="booking-offset"
                      className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                      required
                      value={draft.offset}
                      onChange={event =>
                        setDraft({ ...draft, offset: event.target.value })
                      }
                    >
                      <option value="">Choose which occurrence</option>
                      {offsets.map(offset => (
                        <option key={offset} value={offset}>
                          {offset}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <p className="text-sm">
                  Round duration: {data?.interview.details.duration_minutes}{" "}
                  minutes.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="booking-url">Meeting URL</Label>
                  <Input
                    id="booking-url"
                    className="h-11"
                    type="url"
                    pattern="https://.*"
                    maxLength={2048}
                    value={draft.url}
                    onChange={event =>
                      setDraft({ ...draft, url: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-instructions">
                    Booking instructions
                  </Label>
                  <Textarea
                    id="booking-instructions"
                    maxLength={5000}
                    value={draft.instructions}
                    onChange={event =>
                      setDraft({ ...draft, instructions: event.target.value })
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Candidate-facing meeting, rescheduling and cancellation
                    instructions. Keep internal hiring notes separate.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-feedback">
                    Feedback due within (hours after interview)
                  </Label>
                  <Input
                    id="booking-feedback"
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
                  <p className="text-sm text-muted-foreground">
                    Confirm the feedback deadline for this booking.
                  </p>
                </div>
              </>
            )}
            {(draft.booking || draft.action !== "record") && (
              <div className="space-y-2">
                <Label htmlFor="booking-reason">Reason</Label>
                <Textarea
                  id="booking-reason"
                  maxLength={2000}
                  required
                  value={draft.reason}
                  onChange={event =>
                    setDraft({ ...draft, reason: event.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Internal scheduling history. This reason is not included in
                  candidate communications.
                </p>
              </div>
            )}
            <Button type="submit" className="min-h-11">
              {busy
                ? "Saving…"
                : draft.action === "record"
                ? "Save booking"
                : draft.action === "cancel"
                ? "Confirm cancellation"
                : "Confirm no-show"}
            </Button>
          </fieldset>
        </form>
      )}
      {loading && <p role="status">Loading booking history…</p>}
      {data && (
        <>
          {!data.bookings.length && <p>No bookings recorded.</p>}
          <ol className="space-y-4">
            {data.bookings.map(booking => (
              <li
                key={booking.id}
                className="min-w-0 space-y-3 rounded-lg border p-4"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <h5 className="font-semibold">Booking {booking.number}</h5>
                  <Badge variant="secondary">
                    {booking.status === "no_show"
                      ? "No-show"
                      : stageLabel(booking.status)}
                  </Badge>
                </div>
                <p className="break-words">
                  Candidate time:{" "}
                  <time dateTime={booking.starts_at}>
                    {bookingTimeLabel(
                      booking.starts_at,
                      booking.details.candidate_time_zone
                    )}
                  </time>{" "}
                  –{" "}
                  {bookingTimeLabel(
                    booking.ends_at,
                    booking.details.candidate_time_zone
                  )}{" "}
                  · {booking.details.candidate_time_zone} (UTC
                  {booking.details.utc_offset})
                </p>
                <p className="break-words text-sm text-muted-foreground">
                  UTC: {bookingTimeLabel(booking.starts_at, "Etc/UTC")} –{" "}
                  {bookingTimeLabel(booking.ends_at, "Etc/UTC")}
                </p>
                <p className="break-words">
                  Feedback due:{" "}
                  {bookingTimeLabel(
                    booking.feedback_due_at,
                    booking.details.candidate_time_zone
                  )}{" "}
                  · {booking.details.candidate_time_zone}
                </p>
                <p className="text-sm text-muted-foreground">
                  Recorded from{" "}
                  {booking.details.source === "google_calendar"
                    ? "Google Calendar"
                    : "manual entry"}
                </p>
                <p className="whitespace-pre-wrap break-words">
                  {booking.details.booking_instructions}
                </p>
                {booking.ending_reason && (
                  <p className="whitespace-pre-wrap break-words">
                    Reason: {booking.ending_reason}
                  </p>
                )}
                {booking.status === "scheduled" &&
                  booking.details.meeting_url && (
                    <a
                      className="inline-flex min-h-11 max-w-full items-center break-all text-primary underline"
                      href={booking.details.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open meeting
                    </a>
                  )}
                {booking.status === "scheduled" && (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="min-h-11"
                      variant="outline"
                      disabled={locked || !editable}
                      onClick={() => begin(booking)}
                    >
                      Reschedule booking {booking.number}
                    </Button>
                    <Button
                      className="min-h-11"
                      variant="outline"
                      disabled={locked || !editable}
                      onClick={() => begin(booking, "cancel")}
                    >
                      Cancel booking {booking.number}
                    </Button>
                    <Button
                      className="min-h-11"
                      variant="outline"
                      disabled={
                        locked ||
                        !editable ||
                        new Date(booking.starts_at).getTime() > Date.now()
                      }
                      onClick={() => begin(booking, "no_show")}
                    >
                      No-show booking {booking.number}
                    </Button>
                  </div>
                )}
                <InterviewMessages
                  companyId={companyId}
                  path={`${path}/${booking.id}/messages`}
                  bookingNumber={booking.number}
                  onDenied={failed}
                />
              </li>
            ))}
          </ol>
          <Pager
            pagination={data.pagination}
            change={setPage}
            disabled={locked}
          />
        </>
      )}
    </section>
  );
}
