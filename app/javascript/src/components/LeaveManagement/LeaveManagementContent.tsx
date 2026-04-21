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
import { endOfMonth, format, startOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Calendar } from "../ui/calendar";

import { i18n } from "../../i18n";
import LeaveBlock from "./Container/LeaveBlock";
import Table from "./Container/Table";

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

const LeaveManagementContent = ({
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

  const leaveBreakdown = leaveBalance.filter(
    item => item.type === "leave" || item.type === "custom_leave"
  );

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

  const calendarDaySummary = day => {
    const key = format(day, "yyyy-MM-dd");
    const entries = timeoffEntriesByDate[key] || [];

    if (entries.length === 0) {
      return (
        <span className="text-xs text-muted-foreground">
          {i18n.t("leaveManagement.nothingBooked")}
        </span>
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

  const selectedDateLabel = format(selectedDate, "EEE, d MMM");

  const selectedDateSummary =
    selectedDateEntries.length > 0
      ? i18n.t("leaveManagement.recordedTimeAway")
      : i18n.t("leaveManagement.noLeaveOrHoliday");

  const renderEntryCard = entry => {
    const label =
      entry.customLeave?.name ||
      entry.leaveType?.name ||
      entry.holidayInfo?.name ||
      i18n.t("leaveManagement.timeOff");

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
              ? i18n.t("leaveManagement.customLeave")
              : i18n.t("leaveManagement.leave")}
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
          label={i18n.t("leaveManagement.timeAwayUsed")}
          value={`${minToHHMM(
            totalTimeoffEntriesDuration || 0
          )} (${leaveDayCount.toFixed(1)} ${i18n.t("allocationPeriods.days")})`}
        />
        <SummaryCard
          icon={StarFour}
          label={i18n.t("leaveManagement.leaveRemaining")}
          tone="success"
          value={minToHHMM(remainingLeaveMinutes)}
        />
        <SummaryCard
          icon={CalendarBlank}
          label={i18n.t("leaveManagement.optionalHolidays")}
          tone="warning"
          value={
            optionalHolidaySummary?.label || i18n.t("leaveManagement.zeroUsed")
          }
        />
        <SummaryCard
          icon={Sun}
          label={i18n.t("leaveManagement.publicHolidays")}
          tone="accent"
          value={
            nationalHolidaySummary?.label || i18n.t("leaveManagement.zeroUsed")
          }
        />
      </div>

      {/* Leave balance breakdown (leave types only) */}
      {leaveBreakdown.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            {getLeaveBalanaceDateText()}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {leaveBreakdown.map((leaveType, index) => (
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
                {i18n.t("leaveManagement.leaveCalendar")}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {i18n.t("leaveManagement.trackLeaveUsage", {
                  year: currentYear,
                })}
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
              <div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {format(selectedDate, "MMMM yyyy")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {i18n.t("leaveManagement.selectDayToInspect")}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center p-4 sm:p-5">
              <Calendar
                className="rounded-xl border border-border bg-background"
                mode="single"
                month={selectedDate}
                onMonthChange={setSelectedDate}
                onSelect={date => date && setSelectedDate(date)}
                selected={selectedDate}
                modifiers={{
                  hasEntries: day =>
                    (timeoffEntriesByDate[format(day, "yyyy-MM-dd")] || [])
                      .length > 0,
                }}
                modifiersClassNames={{
                  hasEntries:
                    "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary",
                }}
                classNames={{
                  months: "flex flex-col",
                  month: "space-y-4",
                  month_grid: "w-full border-collapse",
                  weekday:
                    "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
                  day: "h-10 w-10 p-0 text-center text-sm relative",
                  day_button: "h-10 w-10 p-0 font-normal rounded-md",
                  selected:
                    "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
                }}
              />
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
                  {i18n.t("leaveManagement.nothingBookedForDate")}
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
                  {i18n.t("leaveManagement.leaveHistory")}
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
                {i18n.t("total")}:{" "}
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

export default LeaveManagementContent;
