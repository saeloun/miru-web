import type { ApplicationChange, Pagination } from "./types";
import type { Interview, RoundDetails, RoundMember } from "./interviewTypes";

export type BookingDetails = {
  starts_local: string;
  candidate_time_zone: string;
  utc_offset: string;
  meeting_url: string;
  booking_instructions: string;
  feedback_hours: number;
  source: "manual" | "google_calendar";
  provider?: {
    calendar_id: string;
    event_id: string;
    etag: string;
    starts_at: string;
    ends_at: string;
  };
};
export type Booking = {
  id: number;
  number: number;
  lock_version: number;
  status: "scheduled" | "cancelled" | "completed" | "no_show";
  starts_at: string;
  ends_at: string;
  feedback_due_at: string;
  ended_at: string | null;
  ending_reason: string | null;
  details: BookingDetails;
  round_details: RoundDetails;
  panel: RoundMember[];
};
export type StaffBooking = Pick<
  Booking,
  "id" | "status" | "starts_at" | "ends_at" | "feedback_due_at"
> & {
  details: Pick<
    BookingDetails,
    | "candidate_time_zone"
    | "utc_offset"
    | "meeting_url"
    | "booking_instructions"
  >;
};
export type BookingPage = {
  company_id: number;
  application: ApplicationChange;
  interview: Pick<
    Interview,
    "id" | "number" | "status" | "lock_version" | "details"
  >;
  bookings: Booking[];
  current_booking_id: number | null;
  candidate_time_zone: string | null;
  pagination: Pagination;
};
export const bookingTimeLabel = (value: string, zone: string) =>
  new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...(new Date(value).getUTCSeconds() || new Date(value).getUTCMilliseconds()
      ? { second: "2-digit" as const }
      : {}),
    hourCycle: "h23",
    timeZone: zone,
  }).format(new Date(value));
