import React, { useState } from "react";
import dayjs from "dayjs";
import EntryCard from "./EntryCard";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Button } from "../ui/button";

dayjs.extend(customParseFormat);

interface TimeEntriesDisplayProps {
  selectedFullDate: string;
  entryList: any;
  handleDeleteEntry: (id: number) => void;
  handleDuplicate: (entry: any) => void;
  handleResumeTimer: (entry: any) => void;
  setEditEntryId: (id: number) => void;
  setNewEntryView: (value: boolean) => void;
  dayInfo?: any[];
  view?: string;
}

const TimeEntriesDisplay: React.FC<TimeEntriesDisplayProps> = ({
  selectedFullDate,
  entryList,
  handleDeleteEntry,
  handleDuplicate,
  handleResumeTimer,
  setEditEntryId,
  setNewEntryView,
  dayInfo = [],
  view = "week",
}) => {
  const [reviewMode, setReviewMode] = useState<"day" | "week">("day");
  const dateFormats = [
    "YYYY-MM-DD",
    "MM-DD-YYYY",
    "DD-MM-YYYY",
    "MM/DD/YYYY",
    "DD/MM/YYYY",
  ];
  const parsedDate = dayjs(selectedFullDate, dateFormats, true);
  const isoDate = parsedDate.format("YYYY-MM-DD");
  const entries = entryList[isoDate];
  const hasEntries = entries && entries.length > 0;
  const weekEntries = (dayInfo || []).flatMap(day => {
    const dayDate = dayjs(day.fullDate, dateFormats, true);
    const dayKey = dayDate.isValid()
      ? dayDate.format("YYYY-MM-DD")
      : day.fullDate;
    const dayEntries = entryList[dayKey] || [];

    return dayEntries.map(entry => ({
      ...entry,
      display_date: dayKey,
    }));
  });
  const canShowWeekReview = view === "week" && weekEntries.length > 0;
  const reviewEntries = reviewMode === "week" ? weekEntries : entries || [];
  const shouldRenderReviewPanel = hasEntries || canShowWeekReview;

  if (shouldRenderReviewPanel) {
    const totalDuration = reviewEntries.reduce(
      (sum: number, entry: any) => sum + entry.duration,
      0
    );
    const totalHours = Math.floor(totalDuration / 60);
    const totalMinutes = totalDuration % 60;

    return (
      <div className="space-y-4">
        <div className="mb-6 flex items-center justify-between border-b border-border pb-6">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              {parsedDate.format("dddd")}
            </h3>
            <p className="mt-2 text-base font-medium text-muted-foreground">
              {reviewMode === "week"
                ? `${dayjs(dayInfo[0]?.fullDate, dateFormats, true).format(
                    "MMM D"
                  )} to ${dayjs(dayInfo[6]?.fullDate, dateFormats, true).format(
                    "MMM D, YYYY"
                  )}`
                : parsedDate.format("MMMM D, YYYY")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canShowWeekReview && (
              <div className="flex items-center gap-2 rounded-full border border-border bg-card p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={reviewMode === "day" ? "default" : "ghost"}
                  data-testid="time-review-day"
                  onClick={() => setReviewMode("day")}
                >
                  Selected Day
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={reviewMode === "week" ? "default" : "ghost"}
                  data-testid="time-review-week"
                  onClick={() => setReviewMode("week")}
                >
                  This Week
                </Button>
              </div>
            )}
            <div className="rounded-2xl border border-border bg-muted/40 px-8 py-4 text-right">
              <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {reviewMode === "week" ? "Week Total" : "Day Total"}
              </div>
              <div className="text-2xl font-semibold tracking-tight text-primary tabular-nums">
                {totalHours}h {totalMinutes > 0 ? `${totalMinutes}m` : ""}
              </div>
              <div className="mt-2 text-sm font-medium text-muted-foreground">
                {reviewEntries.length}{" "}
                {reviewEntries.length === 1 ? "entry" : "entries"}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {reviewEntries.length > 0 ? (
            reviewEntries.map((entry: any, index: number) => (
              <EntryCard
                key={entry.id || index}
                id={entry.id}
                client={entry.client}
                project={entry.project}
                projectId={entry.project_id}
                note={entry.note}
                duration={entry.duration}
                source_label={entry.source_label}
                source_metadata={entry.source_metadata}
                bill_status={entry.bill_status}
                handleResumeTimer={handleResumeTimer}
                handleDeleteEntry={handleDeleteEntry}
                handleDuplicate={handleDuplicate}
                setEditEntryId={setEditEntryId}
                setNewEntryView={setNewEntryView}
              />
            ))
          ) : (
            <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-12 text-center">
              <div className="mx-auto max-w-md">
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  No entries for the selected day
                </h3>
                <p className="text-sm text-muted-foreground">
                  Switch to This Week to review everything you logged this week.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-12 text-center">
      <div className="mx-auto max-w-md">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card shadow-sm">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-xl font-semibold text-foreground">
          No time entries yet
        </h3>
        <p className="mb-1 text-muted-foreground">
          {parsedDate.format("dddd, MMMM D, YYYY")}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Click "Add Entry" to log your first time entry for this day
        </p>
      </div>
    </div>
  );
};

export default TimeEntriesDisplay;
