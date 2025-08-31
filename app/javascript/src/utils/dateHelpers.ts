import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isBetween from "dayjs/plugin/isBetween";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
import isYesterday from "dayjs/plugin/isYesterday";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import weekOfYear from "dayjs/plugin/weekOfYear";
import weekday from "dayjs/plugin/weekday";

// Initialize plugins
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.extend(isYesterday);
dayjs.extend(quarterOfYear);
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(weekOfYear);
dayjs.extend(weekday);

export type DateFormat =
  | "DD/MM/YYYY"
  | "MM/DD/YYYY"
  | "YYYY-MM-DD"
  | "DD MMM YYYY"
  | "MMM DD, YYYY"
  | "MMMM DD, YYYY";

export type TimeFormat = "12h" | "24h";

export interface DateRange {
  start: Date | string;
  end: Date | string;
}

export class DateHelper {
  private defaultDateFormat: DateFormat = "DD/MM/YYYY";
  private defaultTimeFormat: TimeFormat = "12h";

  constructor(dateFormat?: DateFormat, timeFormat?: TimeFormat) {
    if (dateFormat) this.defaultDateFormat = dateFormat;

    if (timeFormat) this.defaultTimeFormat = timeFormat;
  }

  /**
   * Format date with specified or default format
   */
  formatDate(date: Date | string, format?: DateFormat): string {
    const fmt = format || this.defaultDateFormat;

    return dayjs(date).format(fmt);
  }

  /**
   * Format time with 12h or 24h format
   */
  formatTime(date: Date | string, format?: TimeFormat): string {
    const fmt = format || this.defaultTimeFormat;

    return dayjs(date).format(fmt === "12h" ? "h:mm A" : "HH:mm");
  }

  /**
   * Format date and time together
   */
  formatDateTime(
    date: Date | string,
    dateFormat?: DateFormat,
    timeFormat?: TimeFormat
  ): string {
    const datePart = this.formatDate(date, dateFormat);
    const timePart = this.formatTime(date, timeFormat);

    return `${datePart} ${timePart}`;
  }

  /**
   * Get relative time (e.g., "2 hours ago", "in 3 days")
   */
  getRelativeTime(date: Date | string): string {
    return dayjs(date).fromNow();
  }

  /**
   * Get human-readable date
   */
  getHumanDate(date: Date | string): string {
    const d = dayjs(date);

    if (d.isToday()) return "Today";

    if (d.isYesterday()) return "Yesterday";

    if (d.isTomorrow()) return "Tomorrow";

    const now = dayjs();
    const diffDays = d.diff(now, "day");

    if (diffDays > 0 && diffDays <= 7) {
      return `Next ${d.format("dddd")}`;
    }

    if (diffDays < 0 && diffDays >= -7) {
      return `Last ${d.format("dddd")}`;
    }

    if (d.year() === now.year()) {
      return d.format("MMM DD");
    }

    return d.format("MMM DD, YYYY");
  }

  /**
   * Get date range for common periods
   */
  getDateRange(
    period:
      | "today"
      | "yesterday"
      | "thisWeek"
      | "lastWeek"
      | "thisMonth"
      | "lastMonth"
      | "thisQuarter"
      | "lastQuarter"
      | "thisYear"
      | "lastYear"
  ): DateRange {
    const now = dayjs();
    let start: dayjs.Dayjs;
    let end: dayjs.Dayjs;

    switch (period) {
      case "today":
        start = now.startOf("day");
        end = now.endOf("day");
        break;
      case "yesterday":
        start = now.subtract(1, "day").startOf("day");
        end = now.subtract(1, "day").endOf("day");
        break;
      case "thisWeek":
        start = now.startOf("week");
        end = now.endOf("week");
        break;
      case "lastWeek":
        start = now.subtract(1, "week").startOf("week");
        end = now.subtract(1, "week").endOf("week");
        break;
      case "thisMonth":
        start = now.startOf("month");
        end = now.endOf("month");
        break;
      case "lastMonth":
        start = now.subtract(1, "month").startOf("month");
        end = now.subtract(1, "month").endOf("month");
        break;
      case "thisQuarter":
        start = now.startOf("quarter");
        end = now.endOf("quarter");
        break;
      case "lastQuarter":
        start = now.subtract(1, "quarter").startOf("quarter");
        end = now.subtract(1, "quarter").endOf("quarter");
        break;
      case "thisYear":
        start = now.startOf("year");
        end = now.endOf("year");
        break;
      case "lastYear":
        start = now.subtract(1, "year").startOf("year");
        end = now.subtract(1, "year").endOf("year");
        break;
    }

    return {
      start: start.toDate(),
      end: end.toDate(),
    };
  }

  /**
   * Get custom date range (last N days)
   */
  getLastNDaysRange(days: number): DateRange {
    const end = dayjs().endOf("day");
    const start = dayjs()
      .subtract(days - 1, "day")
      .startOf("day");

    return {
      start: start.toDate(),
      end: end.toDate(),
    };
  }

  /**
   * Check if date is in range
   */
  isInRange(date: Date | string, range: DateRange): boolean {
    return dayjs(date).isBetween(
      dayjs(range.start),
      dayjs(range.end),
      null,
      "[]"
    );
  }

  /**
   * Get week number
   */
  getWeekNumber(date: Date | string): number {
    return dayjs(date).week();
  }

  /**
   * Get quarter
   */
  getQuarter(date: Date | string): number {
    return dayjs(date).quarter();
  }

  /**
   * Parse date from string with format
   */
  parseDate(dateString: string, format: DateFormat): Date | null {
    const parsed = dayjs(dateString, format);

    return parsed.isValid() ? parsed.toDate() : null;
  }

  /**
   * Get days between two dates
   */
  getDaysBetween(start: Date | string, end: Date | string): number {
    return dayjs(end).diff(dayjs(start), "day");
  }

  /**
   * Get business days between two dates (excluding weekends)
   */
  getBusinessDaysBetween(start: Date | string, end: Date | string): number {
    let count = 0;
    let current = dayjs(start);
    const endDate = dayjs(end);

    while (current.isBefore(endDate) || current.isSame(endDate)) {
      if (current.day() !== 0 && current.day() !== 6) {
        count++;
      }
      current = current.add(1, "day");
    }

    return count;
  }

  /**
   * Add business days to a date
   */
  addBusinessDays(date: Date | string, days: number): Date {
    let current = dayjs(date);
    let remaining = days;

    while (remaining > 0) {
      current = current.add(1, "day");
      if (current.day() !== 0 && current.day() !== 6) {
        remaining--;
      }
    }

    return current.toDate();
  }

  /**
   * Get month name
   */
  getMonthName(date: Date | string, format: "short" | "long" = "long"): string {
    return dayjs(date).format(format === "short" ? "MMM" : "MMMM");
  }

  /**
   * Get day name
   */
  getDayName(date: Date | string, format: "short" | "long" = "long"): string {
    return dayjs(date).format(format === "short" ? "ddd" : "dddd");
  }

  /**
   * Check if date is weekend
   */
  isWeekend(date: Date | string): boolean {
    const day = dayjs(date).day();

    return day === 0 || day === 6;
  }

  /**
   * Get start of period
   */
  getStartOf(
    date: Date | string,
    unit: "day" | "week" | "month" | "quarter" | "year"
  ): Date {
    return dayjs(date).startOf(unit).toDate();
  }

  /**
   * Get end of period
   */
  getEndOf(
    date: Date | string,
    unit: "day" | "week" | "month" | "quarter" | "year"
  ): Date {
    return dayjs(date).endOf(unit).toDate();
  }

  /**
   * Format duration in hours and minutes
   */
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    }

    if (mins === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${mins}m`;
  }

  /**
   * Get calendar dates for a month view
   */
  getCalendarDates(year: number, month: number): Date[] {
    const firstDay = dayjs().year(year).month(month).date(1);
    const startDate = firstDay.startOf("week");
    const endDate = firstDay.endOf("month").endOf("week");

    const dates: Date[] = [];
    let current = startDate;

    while (current.isBefore(endDate) || current.isSame(endDate)) {
      dates.push(current.toDate());
      current = current.add(1, "day");
    }

    return dates;
  }
}

// Export convenience functions
export const dateHelper = new DateHelper();

export const formatDate = (date: Date | string, format?: DateFormat) =>
  dateHelper.formatDate(date, format);

export const formatTime = (date: Date | string, format?: TimeFormat) =>
  dateHelper.formatTime(date, format);

export const formatDateTime = (
  date: Date | string,
  dateFormat?: DateFormat,
  timeFormat?: TimeFormat
) => dateHelper.formatDateTime(date, dateFormat, timeFormat);

export const getRelativeTime = (date: Date | string) =>
  dateHelper.getRelativeTime(date);

export const getHumanDate = (date: Date | string) =>
  dateHelper.getHumanDate(date);

export const getDateRange = (
  period: Parameters<DateHelper["getDateRange"]>[0]
) => dateHelper.getDateRange(period);

export const formatDuration = (minutes: number) =>
  dateHelper.formatDuration(minutes);

export default dateHelper;
