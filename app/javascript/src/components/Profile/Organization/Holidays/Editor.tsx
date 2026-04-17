import React, { useState } from "react";
import dayjs from "dayjs";
import {
  Calendar,
  Plus,
  Trash,
  Gift,
  CalendarPlus,
  ToggleLeft,
  ToggleRight,
} from "phosphor-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { i18n } from "../../../../i18n";
import CustomReactSelect from "common/CustomReactSelect";
import SingleYearDatePicker from "common/CustomYearPicker/SingleYearDatePicker";
import { allocationFrequency } from "constants/leaveType";
import { customStyles } from "./utils";

const monthLabels = [
  i18n.t("monthJan"),
  i18n.t("monthFeb"),
  i18n.t("monthMar"),
  i18n.t("monthApr"),
  i18n.t("monthMay"),
  i18n.t("monthJun"),
  i18n.t("monthJul"),
  i18n.t("monthAug"),
  i18n.t("monthSep"),
  i18n.t("monthOct"),
  i18n.t("monthNov"),
  i18n.t("monthDec"),
];

const weekdayLabels = [
  i18n.t("holidaysSettings.weekdays.sun"),
  i18n.t("holidaysSettings.weekdays.mon"),
  i18n.t("holidaysSettings.weekdays.tue"),
  i18n.t("holidaysSettings.weekdays.wed"),
  i18n.t("holidaysSettings.weekdays.thu"),
  i18n.t("holidaysSettings.weekdays.fri"),
  i18n.t("holidaysSettings.weekdays.sat"),
];

const buildHolidayDate = (date, dateFormat) => {
  if (!date) return null;

  const parsedDate = dayjs(
    date,
    [dateFormat, "DD.MM.YYYY", "YYYY-MM-DD"],
    true
  );

  if (parsedDate.isValid()) {
    return parsedDate;
  }

  const fallbackDate = dayjs(date);

  return fallbackDate.isValid() ? fallbackDate : null;
};

const buildMonthGrid = (year, month) => {
  const firstDay = dayjs(new Date(year, month, 1));
  const daysInMonth = firstDay.daysInMonth();
  const leadingEmptyDays = firstDay.day();
  const cells = [
    ...Array.from({ length: leadingEmptyDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return Array.from({ length: cells.length / 7 }, (_, index) =>
    cells.slice(index * 7, index * 7 + 7)
  );
};

type TabKey = "public" | "optional" | "glance";

const OrganizationHolidaysEditor = ({
  canManageHolidays,
  isDesktop,
  dateFormat,
  currentYear,
  setCurrentYear,
  enableOptionalHolidays,
  setEnableOptionalHolidays,
  isEditable,
  setIsEditable,
  holidayList,
  optionalHolidaysList,
  totalOptionalHolidays,
  optionalRepetitionType,
  wrapperRef,
  optionalWrapperRef,
  showDatePicker,
  setShowDatePicker,
  showOptionalDatePicker,
  setShowOptionalDatePicker,
  handleAddHoliday,
  handleCancelAction,
  handleChangeRepetitionOpHoliday,
  handleChangeTotalOpHoliday,
  handleCheckboxClick,
  handleDatePicker,
  handleDeleteHoliday,
  handleHolidateNameChange,
  holidayErrors,
  optionalHolidayErrors,
  updateHolidayDetails,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("public");
  const canEdit = canManageHolidays && isEditable;

  const allHolidays = [...holidayList, ...optionalHolidaysList]
    .map(holiday => {
      const holidayDate = buildHolidayDate(holiday.date, dateFormat);

      if (!holidayDate) return null;

      return {
        ...holiday,
        parsedDate: holidayDate,
        categoryKey: holiday.category === "optional" ? "optional" : "public",
      };
    })
    .filter(Boolean)
    .sort(
      (left, right) => left.parsedDate.valueOf() - right.parsedDate.valueOf()
    );

  const holidaysByMonth = allHolidays.reduce((accumulator, holiday) => {
    const month = holiday.parsedDate.month();

    if (!accumulator[month]) {
      accumulator[month] = [];
    }

    accumulator[month].push(holiday);

    return accumulator;
  }, {});

  const holidayMap = allHolidays.reduce((accumulator, holiday) => {
    accumulator[holiday.parsedDate.format("YYYY-MM-DD")] = holiday;

    return accumulator;
  }, {});

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    {
      key: "public",
      label: i18n.t("holidaysSettings.publicHolidays"),
      icon: <Gift size={16} weight="bold" />,
    },
    {
      key: "optional",
      label: i18n.t("holidaysSettings.optionalHolidays"),
      icon: <CalendarPlus size={16} weight="bold" />,
    },
    {
      key: "glance",
      label: i18n.t("holidaysSettings.yearAtAGlance"),
      icon: <Calendar size={16} weight="bold" />,
    },
  ];

  return (
    <div className="min-h-screen bg-muted/40 font-geist">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top bar: year selector + actions */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
            <Calendar
              size={16}
              className="text-muted-foreground"
              weight="bold"
            />
            <select
              value={currentYear}
              onChange={e => setCurrentYear(parseInt(e.target.value))}
              className="bg-transparent border-none focus:outline-none font-geist-medium text-sm"
            >
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - 2 + i;

                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {canEdit ? (
              <Button
                onClick={handleCancelAction}
                variant="outline"
                className="font-geist-medium"
              >
                {i18n.t("cancel")}
              </Button>
            ) : null}
            {canManageHolidays ? (
              <Button
                onClick={() => {
                  if (canEdit) {
                    updateHolidayDetails();
                  } else {
                    setIsEditable(true);
                  }
                }}
                className="font-geist-medium"
              >
                {canEdit
                  ? i18n.t("preferencesSettings.saveChanges")
                  : i18n.t("edit")}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Summary strip */}
        <Card className="border-border shadow-sm mb-6">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-6 divide-x divide-border">
              <div className="flex items-center gap-2 pr-6">
                <span className="text-sm text-muted-foreground font-geist-regular">
                  {i18n.t("holidaysSettings.year")}
                </span>
                <span className="text-lg font-geist-semibold">
                  {currentYear}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-6">
                <Gift
                  size={16}
                  className="text-muted-foreground"
                  weight="bold"
                />
                <span className="text-sm text-muted-foreground font-geist-regular">
                  {i18n.t("holidaysSettings.publicHolidays")}
                </span>
                <span className="text-lg font-geist-semibold">
                  {holidayList.length}
                </span>
              </div>
              {enableOptionalHolidays && (
                <>
                  <div className="flex items-center gap-2 pl-6">
                    <CalendarPlus
                      size={16}
                      className="text-muted-foreground"
                      weight="bold"
                    />
                    <span className="text-sm text-muted-foreground font-geist-regular">
                      {i18n.t("holidaysSettings.optionalHolidays")}
                    </span>
                    <span className="text-lg font-geist-semibold">
                      {optionalHolidaysList.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pl-6">
                    <span className="text-sm text-muted-foreground font-geist-regular">
                      {i18n.t("holidaysSettings.allowedPerEmployee")}
                    </span>
                    <span className="text-lg font-geist-semibold">
                      {totalOptionalHolidays || 0}
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-geist-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "public" && (
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                <Gift className="h-5 w-5 text-muted-foreground" weight="bold" />
                {i18n.t("holidaysSettings.publicHolidays")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {canEdit ? (
                /* Edit mode: form-style rows */
                <div className="space-y-3">
                  {holidayList.map((holiday, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg"
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative">
                          <Label className="text-xs font-geist-medium text-muted-foreground uppercase tracking-wider mb-1">
                            {i18n.t("date")}
                          </Label>
                          <div
                            className="relative cursor-pointer"
                            onClick={() => {
                              setShowDatePicker({
                                visibility: !showDatePicker.visibility,
                                index,
                              });
                            }}
                          >
                            <Input
                              readOnly
                              className={`font-geist-regular cursor-pointer pr-10 ${
                                holidayErrors[index]?.date
                                  ? "border-destructive"
                                  : ""
                              }`}
                              placeholder={i18n.t(
                                "holidaysSettings.selectDate"
                              )}
                              value={holiday.date}
                            />
                            <Calendar
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
                              size={16}
                              weight="bold"
                            />
                          </div>
                          {index === showDatePicker.index &&
                            showDatePicker.visibility && (
                              <div className="absolute z-10 mt-1">
                                <SingleYearDatePicker
                                  dateFormat={dateFormat}
                                  selectedYear={currentYear}
                                  setVisibility={showDatePicker.visibility}
                                  wrapperRef={wrapperRef}
                                  date={
                                    holiday.date ||
                                    dayjs().set("year", currentYear)
                                  }
                                  handleChange={e =>
                                    handleDatePicker(e, index, false)
                                  }
                                />
                              </div>
                            )}
                          {holidayErrors[index]?.date && (
                            <p className="mt-1 text-xs text-destructive">
                              {holidayErrors[index].date.join(", ")}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs font-geist-medium text-muted-foreground uppercase tracking-wider mb-1">
                            {i18n.t("holidaysSettings.holidayName")}
                          </Label>
                          <Input
                            className={`font-geist-regular ${
                              holidayErrors[index]?.name
                                ? "border-destructive"
                                : ""
                            }`}
                            placeholder={i18n.t(
                              "holidaysSettings.enterHolidayName"
                            )}
                            value={holiday.name}
                            onChange={e =>
                              handleHolidateNameChange(e, index, false)
                            }
                          />
                          {holidayErrors[index]?.name && (
                            <p className="mt-1 text-xs text-destructive">
                              {holidayErrors[index].name.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        aria-label="Delete holiday"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteHoliday(false, index)}
                        className="mt-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash size={16} weight="bold" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => handleAddHoliday(false)}
                    className="w-full border-dashed border-border font-geist-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  >
                    <Plus size={16} weight="bold" className="mr-2" />
                    {i18n.t("holidaysSettings.addHoliday")}
                  </Button>
                </div>
              ) : holidayList.length > 0 ? (
                /* Read mode: compact table */
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="px-4 py-3 text-left text-xs font-geist-medium text-muted-foreground uppercase tracking-wider">
                          {i18n.t("date")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-geist-medium text-muted-foreground uppercase tracking-wider">
                          {i18n.t("holidaysSettings.holidayName")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {holidayList.map((holiday, index) => (
                        <tr
                          key={index}
                          className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm font-geist-regular text-foreground">
                            {holiday.date}
                          </td>
                          <td className="px-4 py-3 text-sm font-geist-regular text-foreground">
                            {holiday.name}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gift
                    size={48}
                    className="mx-auto mb-3 text-muted-foreground"
                    weight="thin"
                  />
                  <p className="text-muted-foreground font-geist-regular mb-3">
                    {i18n.t("holidaysSettings.noPublicHolidaysConfigured")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "optional" && (
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                  <CalendarPlus
                    className="h-5 w-5 text-muted-foreground"
                    weight="bold"
                  />
                  {i18n.t("holidaysSettings.optionalHolidays")}
                </CardTitle>
                <button
                  onClick={handleCheckboxClick}
                  className="transition-colors"
                  disabled={!canEdit}
                  type="button"
                >
                  {enableOptionalHolidays ? (
                    <ToggleRight
                      size={32}
                      className="text-primary"
                      weight="fill"
                    />
                  ) : (
                    <ToggleLeft
                      size={32}
                      className="text-muted-foreground"
                      weight="fill"
                    />
                  )}
                </button>
              </div>
            </CardHeader>
            {enableOptionalHolidays && (
              <CardContent>
                <div className="space-y-4">
                  {/* Configuration — inline row */}
                  <div className="flex flex-wrap items-end gap-4 pb-4 border-b border-border">
                    <div className="w-40">
                      <Label className="text-xs font-geist-medium text-muted-foreground uppercase tracking-wider">
                        {i18n.t("holidaysSettings.totalAllowed")}
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        className="font-geist-regular mt-1"
                        disabled={!canEdit}
                        placeholder={i18n.t("holidaysSettings.enterNumber")}
                        value={totalOptionalHolidays}
                        onChange={handleChangeTotalOpHoliday}
                      />
                    </div>
                    <div className="w-48">
                      <Label className="text-xs font-geist-medium text-muted-foreground uppercase tracking-wider">
                        {i18n.t("holidaysSettings.frequency")}
                      </Label>
                      <div className="mt-1">
                        <CustomReactSelect
                          isDisabled={!canEdit}
                          handleOnChange={handleChangeRepetitionOpHoliday}
                          id="allocationFrequency"
                          label=""
                          name="allocationFrequency"
                          options={allocationFrequency}
                          styles={customStyles}
                          wrapperClassName="h-10"
                          components={{ IndicatorSeparator: () => null }}
                          value={
                            optionalRepetitionType
                              ? allocationFrequency.filter(
                                  option =>
                                    option.value === optionalRepetitionType
                                )
                              : allocationFrequency[0]
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {canEdit ? (
                    /* Edit mode: form-style rows */
                    <div className="space-y-3">
                      {optionalHolidaysList.map((optionalHoliday, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg"
                        >
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="relative">
                              <Label className="text-xs font-geist-medium text-muted-foreground uppercase tracking-wider mb-1">
                                {i18n.t("date")}
                              </Label>
                              <div
                                className="relative cursor-pointer"
                                onClick={() => {
                                  setShowOptionalDatePicker({
                                    visibility:
                                      !showOptionalDatePicker.visibility,
                                    index,
                                  });
                                }}
                              >
                                <Input
                                  readOnly
                                  className={`font-geist-regular cursor-pointer pr-10 ${
                                    optionalHolidayErrors[index]?.date
                                      ? "border-destructive"
                                      : ""
                                  }`}
                                  disabled={!canEdit}
                                  placeholder={i18n.t(
                                    "holidaysSettings.selectDate"
                                  )}
                                  value={optionalHoliday.date}
                                />
                                <Calendar
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
                                  size={16}
                                  weight="bold"
                                />
                              </div>
                              {index === showOptionalDatePicker.index &&
                                showOptionalDatePicker.visibility && (
                                  <div className="absolute z-10 mt-1">
                                    <SingleYearDatePicker
                                      dateFormat={dateFormat}
                                      selectedYear={currentYear}
                                      wrapperRef={optionalWrapperRef}
                                      date={
                                        optionalHoliday.date ||
                                        dayjs().set("year", currentYear)
                                      }
                                      handleChange={e =>
                                        handleDatePicker(e, index, true)
                                      }
                                      setVisibility={
                                        showOptionalDatePicker.visibility
                                      }
                                    />
                                  </div>
                                )}
                              {optionalHolidayErrors[index]?.date && (
                                <p className="mt-1 text-xs text-destructive">
                                  {optionalHolidayErrors[index].date.join(", ")}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label className="text-xs font-geist-medium text-muted-foreground uppercase tracking-wider mb-1">
                                {i18n.t("holidaysSettings.holidayName")}
                              </Label>
                              <Input
                                className={`font-geist-regular ${
                                  optionalHolidayErrors[index]?.name
                                    ? "border-destructive"
                                    : ""
                                }`}
                                disabled={!canEdit}
                                placeholder={i18n.t(
                                  "holidaysSettings.enterHolidayName"
                                )}
                                value={optionalHoliday.name}
                                onChange={e =>
                                  handleHolidateNameChange(e, index, true)
                                }
                              />
                              {optionalHolidayErrors[index]?.name && (
                                <p className="mt-1 text-xs text-destructive">
                                  {optionalHolidayErrors[index].name.join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            aria-label="Delete holiday"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteHoliday(true, index)}
                            className="mt-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash size={16} weight="bold" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => handleAddHoliday(true)}
                        className="w-full border-dashed border-border font-geist-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      >
                        <Plus size={16} weight="bold" className="mr-2" />
                        {i18n.t("holidaysSettings.addOptionalHoliday")}
                      </Button>
                    </div>
                  ) : optionalHolidaysList.length > 0 ? (
                    /* Read mode: compact table */
                    <div className="overflow-hidden rounded-lg border border-border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-muted/40">
                            <th className="px-4 py-3 text-left text-xs font-geist-medium text-muted-foreground uppercase tracking-wider">
                              {i18n.t("date")}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-geist-medium text-muted-foreground uppercase tracking-wider">
                              {i18n.t("holidaysSettings.holidayName")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {optionalHolidaysList.map((holiday, index) => (
                            <tr
                              key={index}
                              className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                            >
                              <td className="px-4 py-3 text-sm font-geist-regular text-foreground">
                                {holiday.date}
                              </td>
                              <td className="px-4 py-3 text-sm font-geist-regular text-foreground">
                                {holiday.name}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <CalendarPlus
                        size={36}
                        className="mx-auto mb-2 text-muted-foreground"
                        weight="thin"
                      />
                      <p className="text-sm text-muted-foreground font-geist-regular mb-3">
                        {i18n.t(
                          "holidaysSettings.noOptionalHolidaysConfigured"
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {activeTab === "glance" && (
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-geist-semibold text-card-foreground">
                {i18n.t("holidaysSettings.yearAtAGlance")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                data-testid="holidays-calendar"
              >
                {monthLabels.map((monthLabel, monthIndex) => (
                  <div
                    key={`${monthLabel}-${monthIndex}`}
                    className="rounded-xl border border-border bg-muted/30 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-geist-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        {monthLabel}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {holidaysByMonth[monthIndex]?.length || 0}
                      </p>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground mb-1">
                      {weekdayLabels.map((label, labelIndex) => (
                        <span
                          key={`${monthLabel}-${label}-${labelIndex}`}
                          className="text-center font-geist-medium"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                    <div className="space-y-1">
                      {buildMonthGrid(currentYear, monthIndex).map(
                        (week, weekIndex) => (
                          <div
                            key={`${monthLabel}-week-${weekIndex}`}
                            className="grid grid-cols-7 gap-1"
                          >
                            {week.map((day, dayIndex) => {
                              if (!day) {
                                return (
                                  <span
                                    key={`${monthLabel}-blank-${weekIndex}-${dayIndex}`}
                                  />
                                );
                              }

                              const isoDate = dayjs(
                                new Date(currentYear, monthIndex, day)
                              ).format("YYYY-MM-DD");
                              const holiday = holidayMap[isoDate];

                              return (
                                <span
                                  key={`${monthLabel}-${day}`}
                                  data-testid={
                                    holiday
                                      ? `holiday-calendar-day-${isoDate}`
                                      : undefined
                                  }
                                  className={`flex h-7 w-7 items-center justify-center rounded-md text-xs ${
                                    holiday
                                      ? "bg-primary text-primary-foreground font-geist-semibold"
                                      : "text-foreground"
                                  }`}
                                  title={holiday?.name}
                                >
                                  {day}
                                </span>
                              );
                            })}
                          </div>
                        )
                      )}
                    </div>
                    {/* Holiday names for this month */}
                    {holidaysByMonth[monthIndex] &&
                      holidaysByMonth[monthIndex].length > 0 && (
                        <div className="mt-3 border-t border-border pt-2 space-y-1">
                          {holidaysByMonth[monthIndex].map((h, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                              <span className="text-[11px] text-muted-foreground truncate">
                                {h.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrganizationHolidaysEditor;
