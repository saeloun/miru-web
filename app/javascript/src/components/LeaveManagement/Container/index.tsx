import React, { useEffect, useState } from "react";

import { useUserContext } from "context/UserContext";
import { minToHHMM } from "helpers";
import {
  CalendarBlank,
  ClockCounterClockwise,
  StarFour,
  Sun,
  X,
} from "phosphor-react";
import { endOfMonth, format, isSameDay, startOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Calendar } from "../../ui/calendar";

import LeaveBlock from "./LeaveBlock";
import Table from "./Table";

const SummaryCard = ({ icon: Icon, label, value, tone = "default" }) => (
  <Card className="border-border shadow-sm">
    <CardContent className="flex items-center gap-4 p-5">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
          tone === "warning"
            ? "bg-amber-500/10 text-amber-600"
            : tone === "accent"
            ? "bg-sky-500/10 text-sky-600"
            : tone === "success"
            ? "bg-emerald-500/10 text-emerald-600"
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

  const dayModifiers = {
    hasEntries: day => {
      const key = format(day, "yyyy-MM-dd");

      return Boolean(timeoffEntriesByDate[key]?.length);
    },
    selectedDay: day => isSameDay(day, selectedDate),
  };

  const dayContent = day => {
    const key = format(day, "yyyy-MM-dd");
    const entries = timeoffEntriesByDate[key] || [];

    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 py-1">
        <span className="text-xs font-medium">{day.getDate()}</span>
        <div className="flex items-center gap-1">
          {entries.slice(0, 3).map(entry => (
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                entry.holidayInfo?.category === "national"
                  ? "bg-slate-500"
                  : entry.holidayInfo?.category === "optional"
                  ? "bg-amber-500"
                  : "bg-primary"
              }`}
              key={`${entry.id}-${entry.leaveDateIso || entry.leaveDate}`}
            />
          ))}
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
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="rounded-2xl border border-border bg-card">
            <Calendar
              className="w-full"
              components={{
                DayContent: ({ date }) => dayContent(date),
              }}
              mode="single"
              modifiers={dayModifiers}
              modifiersClassNames={{
                hasEntries:
                  "bg-primary/5 font-semibold text-foreground rounded-xl",
                selectedDay:
                  "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl",
              }}
              month={selectedDate}
              onMonthChange={setSelectedDate}
              onSelect={date => date && setSelectedDate(date)}
              selected={selectedDate}
            />
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {format(selectedDate, "EEE, d MMM")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedDateEntries.length > 0
                    ? "Recorded time away on this day"
                    : "No leave or holiday marked for this day"}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {selectedDateEntries.length > 0 ? (
                selectedDateEntries.map(entry => {
                  const label =
                    entry.customLeave?.name ||
                    entry.leaveType?.name ||
                    entry.holidayInfo?.name ||
                    "Time off";

                  const tone =
                    entry.holidayInfo?.category === "national"
                      ? "bg-slate-500/10 text-slate-700 dark:text-slate-200"
                      : entry.holidayInfo?.category === "optional"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-200"
                      : "bg-primary/10 text-primary";

                  return (
                    <div
                      className="rounded-xl border border-border bg-background px-3 py-3"
                      key={entry.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{label}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {minToHHMM(entry.duration)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}
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
                })
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground">
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
