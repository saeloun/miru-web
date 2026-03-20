import React, { useEffect, useState } from "react";

import { useUserContext } from "context/UserContext";
import { minToHHMM } from "helpers";
import {
  CaretLeft,
  CaretRight,
  CalendarBlank,
  ClockCounterClockwise,
  StarFour,
  Sun,
  X,
} from "phosphor-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";

import LeaveBlock from "./LeaveBlock";
import Table from "./Table";

const SummaryCard = ({ icon: Icon, label, value, tone = "default" }) => (
  <Card className="border-border shadow-sm">
    <CardContent className="flex items-center gap-4 p-5">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
          tone === "warning"
            ? "bg-muted text-foreground"
            : tone === "accent"
            ? "bg-muted text-foreground"
            : tone === "success"
            ? "bg-card text-foreground border border-border"
            : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const Container = ({
  currentYear,
  getLeaveBalanaceDateText,
  leaveBalance,
  timeoffEntries,
  totalTimeoffEntriesDuration,
  selectedLeaveType,
  setSelectedLeaveType,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(currentYear, new Date().getMonth(), 1)
  );
  const { company } = useUserContext();

  useEffect(() => {
    setSelectedDate(new Date(currentYear, new Date().getMonth(), 1));
  }, [currentYear]);

  const workingHoursPerDay =
    Number(company?.working_hours || 40) / Number(company?.working_days || 5);

  const remainingLeaveMinutes = leaveBalance
    .filter(item => item.type === "leave" || item.type === "custom_leave")
    .reduce((sum, item) => sum + Math.max(item.netDuration || 0, 0), 0);

  const optionalHolidaySummary = leaveBalance.find(
    item => item.id === "optional"
  );

  const nationalHolidaySummary = leaveBalance.find(
    item => item.id === "national"
  );

  const leaveDayCount =
    workingHoursPerDay > 0
      ? (totalTimeoffEntriesDuration || 0) / (workingHoursPerDay * 60)
      : 0;

  const timeoffEntriesByDate = timeoffEntries.reduce((acc, entry) => {
    const key = entry.leaveDateIso || entry.leaveDate;
    if (!key) return acc;

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(entry);

    return acc;
  }, {});

  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDateEntries = timeoffEntriesByDate[selectedDateKey] || [];

  const calendarRangeLabel = `${format(
    startOfMonth(selectedDate),
    "d MMM"
  )} - ${format(endOfMonth(selectedDate), "d MMM yyyy")}`;

  const monthStart = startOfMonth(selectedDate);
  const calendarGridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarGridEnd = endOfWeek(endOfMonth(selectedDate), {
    weekStartsOn: 0,
  });

  const calendarDays = eachDayOfInterval({
    start: calendarGridStart,
    end: calendarGridEnd,
  });

  const weeks = Array.from(
    { length: Math.ceil(calendarDays.length / 7) },
    (_, index) => calendarDays.slice(index * 7, index * 7 + 7)
  );
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const renderDayContent = day => {
    const key = format(day, "yyyy-MM-dd");
    const entries = timeoffEntriesByDate[key] || [];
    const isCurrentMonth = isSameMonth(day, selectedDate);
    const isSelected = isSameDay(day, selectedDate);
    const isTodayDate = isToday(day);

    return (
      <button
        className={`group flex min-h-24 w-full flex-col rounded-2xl border px-3 py-3 text-left transition ${
          isSelected
            ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20"
            : isCurrentMonth
            ? "border-border bg-background hover:border-primary/40 hover:bg-muted/60"
            : "border-border/70 bg-muted/30 text-muted-foreground hover:bg-muted/50"
        }`}
        onClick={() => setSelectedDate(day)}
        type="button"
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-semibold ${
              isSelected
                ? "bg-primary text-primary-foreground"
                : isTodayDate
                ? "bg-foreground text-background"
                : isCurrentMonth
                ? "bg-muted text-foreground"
                : "bg-background text-muted-foreground"
            }`}
          >
            {day.getDate()}
          </span>
          {entries.length > 0 && (
            <Badge className="border-0 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10">
              {entries.length} item{entries.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <div className="mt-4 flex items-center gap-1.5">
          {entries.length > 0 ? (
            entries
              .slice(0, 4)
              .map(entry => (
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    entry.holidayInfo?.category === "national"
                      ? "bg-foreground"
                      : entry.holidayInfo?.category === "optional"
                      ? "bg-muted-foreground"
                      : "bg-card-foreground"
                  }`}
                  key={`${entry.id}-${entry.leaveDateIso || entry.leaveDate}`}
                />
              ))
          ) : isCurrentMonth ? (
            <span className="h-2 w-2 rounded-full bg-muted-foreground/20" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-transparent" />
          )}
        </div>
      </button>
    );
  };

  const calendarDaySummary = day => {
    const key = format(day, "yyyy-MM-dd");
    const entries = timeoffEntriesByDate[key] || [];

    if (entries.length === 0) {
      return (
        <span className="text-xs text-muted-foreground">Nothing booked</span>
      );
    }

    return (
      <div className="mt-4 flex items-center gap-1.5">
        {entries.slice(0, 4).map(entry => (
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              entry.holidayInfo?.category === "national"
                ? "bg-foreground"
                : entry.holidayInfo?.category === "optional"
                ? "bg-muted-foreground"
                : "bg-card-foreground"
            }`}
            key={`${entry.id}-${entry.leaveDateIso || entry.leaveDate}-summary`}
          />
        ))}
      </div>
    );
  };

  const changeMonth = offset => {
    setSelectedDate(previousDate => addMonths(previousDate, offset));
  };

  const selectedDateLabel = format(selectedDate, "EEE, d MMM");

  const selectedDateSummary = (() => {
    if (selectedDateEntries.length > 0) {
      return "Recorded time away on this day";
    }

    if (!isSameMonth(selectedDate, monthStart)) {
      return "This day falls outside the selected month view";
    }

    return "No leave or holiday marked for this day";
  })();

  const renderEntryCard = entry => {
    const label =
      entry.customLeave?.name ||
      entry.leaveType?.name ||
      entry.holidayInfo?.name ||
      "Time off";

    const tone =
      entry.holidayInfo?.category === "national"
        ? "border-border bg-card text-card-foreground"
        : entry.holidayInfo?.category === "optional"
        ? "border-border bg-muted text-foreground"
        : "border-border bg-card text-card-foreground";

    return (
      <div
        className="rounded-2xl border border-border bg-background px-4 py-4"
        key={entry.id}
      >
        <div className="flex items-center gap-1">
          <div>
            <p className="font-medium text-foreground">{label}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {minToHHMM(entry.duration)}
            </p>
          </div>
          <span
            className={`ml-auto rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}
          >
            {entry.holidayInfo?.category
              ? entry.holidayInfo.category
              : entry.customLeave
              ? "custom leave"
              : "leave"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={ClockCounterClockwise}
          label="Time away used"
          value={`${minToHHMM(
            totalTimeoffEntriesDuration || 0
          )} (${leaveDayCount.toFixed(1)} days)`}
        />
        <SummaryCard
          icon={StarFour}
          label="Leave remaining"
          tone="success"
          value={minToHHMM(remainingLeaveMinutes)}
        />
        <SummaryCard
          icon={CalendarBlank}
          label="Optional holidays"
          tone="warning"
          value={optionalHolidaySummary?.label || "0 used"}
        />
        <SummaryCard
          icon={Sun}
          label="Public holidays"
          tone="accent"
          value={nationalHolidaySummary?.label || "0 used"}
        />
      </div>

      {/* Leave Balance Cards */}
      {leaveBalance && leaveBalance.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            {getLeaveBalanaceDateText()}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {leaveBalance.map((leaveType, index) => (
              <LeaveBlock
                key={index}
                leaveType={leaveType}
                selectedLeaveType={selectedLeaveType}
                setSelectedLeaveType={setSelectedLeaveType}
              />
            ))}
          </div>
        </div>
      )}

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">
                Leave calendar
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Track leave and holiday usage month by month for {currentYear}.
              </p>
            </div>
            <Badge className="w-fit border-border bg-muted text-foreground hover:bg-muted">
              {calendarRangeLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,24rem)]">
          <div className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {format(selectedDate, "MMMM yyyy")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Select a day to inspect leave details and holiday usage.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    className="h-10 w-10 rounded-full p-0"
                    onClick={() => changeMonth(-1)}
                    type="button"
                    variant="outline"
                  >
                    <CaretLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    className="h-10 w-10 rounded-full p-0"
                    onClick={() => changeMonth(1)}
                    type="button"
                    variant="outline"
                  >
                    <CaretRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-3 p-5">
              <div className="grid grid-cols-7 gap-3">
                {weekdayLabels.map(label => (
                  <div
                    className="px-1 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                    key={label}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {weeks.map((week, weekIndex) => (
                  <div className="grid grid-cols-7 gap-3" key={weekIndex}>
                    {week.map(day => (
                      <div key={day.toISOString()}>{renderDayContent(day)}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 xl:sticky xl:top-6 xl:self-start">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {selectedDateLabel}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedDateSummary}
                </p>
                {calendarDaySummary(selectedDate)}
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {selectedDateEntries.length > 0 ? (
                selectedDateEntries.map(renderEntryCard)
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground">
                  Nothing booked for this date.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Details Table */}
      {timeoffEntries && timeoffEntries.length > 0 && (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-xl font-semibold">
                  Leave History
                </CardTitle>
                {selectedLeaveType && (
                  <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-muted px-3 py-2 text-sm">
                    <span className="font-medium text-foreground">
                      {selectedLeaveType.name}
                    </span>
                    <X
                      className="h-4 w-4 cursor-pointer text-muted-foreground transition hover:text-foreground"
                      onClick={() => setSelectedLeaveType(null)}
                    />
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground lg:text-right">
                Total:{" "}
                <span className="font-semibold text-foreground">
                  {minToHHMM(totalTimeoffEntriesDuration || 0)}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table timeoffEntries={timeoffEntries} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Container;
