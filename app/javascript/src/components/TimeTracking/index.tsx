import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  timeoffEntriesApi,
  timesheetEntryApi,
  timeTrackingApi,
} from "apis/api";
import Loader from "common/Loader/index";
import withLayout from "common/Mobile/HOC/withLayout";
import SearchTimeEntries from "common/SearchTimeEntries";
import { TimesheetEntriesContext } from "context/TimesheetEntries";
import { useUserContext } from "context/UserContext";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import updateLocale from "dayjs/plugin/updateLocale";
import weekday from "dayjs/plugin/weekday";
import { minToHHMM } from "helpers";
import Logger from "js-logger";
import { sendGAPageView } from "utils/googleAnalytics";
import { Button } from "../ui/button";
import { Toastr } from "../ui/toastr";
import FloatingTimer from "../TimesheetEntries/FloatingTimer";
import TimeoffForm from "../TimeoffEntries/TimeoffForm";
import { startTimerFromEntry } from "utils/timeTrackingTimer";

import WeekDaySelector from "./WeekDaySelector";
import EntryForm from "./EntryForm";
import Header from "./Header";
import WeeklyEntries from "./WeeklyEntries";
import EntryDetailsModal from "./EntryDetailsModal";
import TimeEntriesDisplay from "./TimeEntriesDisplay";
import AddEntryButton from "./AddEntryButton";
import MonthCalendar from "./MonthCalendar";

dayjs.extend(updateLocale);
dayjs.extend(weekday);
dayjs.extend(customParseFormat);

const monthsAbbr = "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_");
dayjs.updateLocale("en", { monthShort: monthsAbbr });

// Day start from monday
dayjs.Ls.en.weekStart = 1;

const TimeTracking: React.FC<Iprops> = ({ user, isAdminUser }) => {
  const { isDesktop, company } = useUserContext();
  const dateFormat =
    company?.date_format || company?.dateFormat || "MM-DD-YYYY"; // Display format

  const [dayInfo, setDayInfo] = useState<any[]>([]);
  const [newEntryView, setNewEntryView] = useState<boolean>(false);
  const [newTimeoffEntryView, setNewTimeoffEntryView] =
    useState<boolean>(false);
  const [newRowView, setNewRowView] = useState<boolean>(false);
  const [selectDate, setSelectDate] = useState<number>(dayjs().weekday());
  const [weekDay, setWeekDay] = useState<number>(0);
  const [weeklyTotalHours, setWeeklyTotalHours] = useState<string>("00:00");
  const [dailyTotalHours, setDailyTotalHours] = useState<number[]>([]);
  const [entryList, setEntryList] = useState<object>({});
  const [selectedFullDate, setSelectedFullDate] = useState<string>(
    dayjs().format("YYYY-MM-DD")
  );
  const [editEntryId, setEditEntryId] = useState<number>(0);
  const [editTimeoffEntryId, setEditTimeoffEntryId] = useState<number>(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isWeeklyEditing, setIsWeeklyEditing] = useState<boolean>(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(
    user?.id
  );
  const [allEmployeesEntries, setAllEmployeesEntries] = useState<object>({});
  const [clients, setClients] = useState<any>({});
  const [projects, setProjects] = useState<any>({});
  const [employees, setEmployees] = useState<any>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [holidayList, setHolidayList] = useState<any[]>([]);
  const [currentMonthNumber, setCurrentMonthNumber] = useState<number>(
    dayjs().month()
  );
  const [currentYear, setCurrentYear] = useState<number>(dayjs().year());
  const [updateView, setUpdateView] = useState(true);
  const [showEntryModal, setShowEntryModal] = useState<boolean>(false);
  const [modalSelectedDate, setModalSelectedDate] = useState<string>("");
  const [view, setView] = useState<string>("week");
  const [runtimeError, setRuntimeError] = useState<string>("");
  const [bootstrappedEmployeeId, setBootstrappedEmployeeId] = useState<
    number | null
  >(null);
  const [loadedRangeKey, setLoadedRangeKey] = useState<string>("");
  const latestRequestKeyRef = useRef<string>("");
  const [copyingLastWeek, setCopyingLastWeek] = useState<boolean>(false);
  const [timerSyncKey, setTimerSyncKey] = useState<number>(0);
  const [resumeTimerEntry, setResumeTimerEntry] = useState<any>(null);
  const dateParseFormats = [
    dateFormat,
    "YYYY-MM-DD",
    "MM-DD-YYYY",
    "DD-MM-YYYY",
    "MM/DD/YYYY",
    "DD/MM/YYYY",
  ];

  const employeeOptions = employees.map(e => ({
    value: `${e["id"]}`,
    label: `${e["first_name"]} ${e["last_name"]}`,
  }));

  const leaveTypeHashObj = useMemo(
    () =>
      leaveTypes.reduce((accumulator, leaveType) => {
        if (leaveType?.id) accumulator[leaveType.id] = leaveType;

        return accumulator;
      }, {}),
    [leaveTypes]
  );

  const holidaysHashObj = useMemo(
    () =>
      holidayList.reduce((accumulator, holidayInfo) => {
        if (holidayInfo?.id) accumulator[holidayInfo.id] = holidayInfo;

        return accumulator;
      }, {}),
    [holidayList]
  );

  const hasNationalHoliday = holidayList.some(
    holidayInfo => holidayInfo?.category === "national"
  );

  const hasOptionalHoliday = holidayList.some(
    holidayInfo => holidayInfo?.category === "optional"
  );

  const getEntriesForDate = (dateValue: string) => {
    if (!dateValue || !entryList) return [];

    const parsedDate = dayjs(dateValue, dateParseFormats, true);
    const candidates = [dateValue];

    if (parsedDate.isValid()) {
      candidates.push(
        parsedDate.format("YYYY-MM-DD"),
        parsedDate.format(dateFormat),
        parsedDate.format("MM-DD-YYYY"),
        parsedDate.format("DD-MM-YYYY")
      );
    }

    const uniqueCandidates = [...new Set(candidates)];
    const matchedKey = uniqueCandidates.find(key =>
      Array.isArray(entryList[key])
    );

    return matchedKey ? entryList[matchedKey] : [];
  };

  const normalizeEntryDateKey = (dateValue: string) => {
    const parsedDate = dayjs(dateValue, dateParseFormats, true);

    return parsedDate.isValid() ? parsedDate.format("YYYY-MM-DD") : dateValue;
  };

  useEffect(() => {
    sendGAPageView();
    const defaultView = "week";
    const savedView = localStorage.getItem("timeTrackingView");
    setView(savedView === "month" ? "month" : defaultView);
  }, []);

  const fetchTimeTrackingData = async ({
    employeeId,
    from,
    to,
    year,
    requestKey,
  }: {
    employeeId?: number;
    from?: string;
    to?: string;
    year?: number | string;
    requestKey?: string;
  } = {}) => {
    const targetEmployeeId = employeeId || selectedEmployeeId || user.id;
    const activeRequestKey =
      requestKey ||
      `bootstrap:${targetEmployeeId}:${from || "default"}:${to || "default"}:${
        year || currentYear
      }`;

    try {
      latestRequestKeyRef.current = activeRequestKey;
      const { data } = await timeTrackingApi.get({
        userId: targetEmployeeId,
        from,
        to,
        year,
      });

      if (latestRequestKeyRef.current !== activeRequestKey) return false;

      const {
        clients,
        projects,
        entries,
        employees,
        leave_types,
        holiday_infos,
      } = data;

      // Ensure clients is an array
      const clientsArray = Array.isArray(clients) ? clients : [];
      setClients(clientsArray);

      // Ensure projects is an object keyed by client name
      const projectsObj = projects || {};
      setProjects(projectsObj);

      // Ensure employees is an array
      const employeesArray = Array.isArray(employees) ? employees : [];
      setEmployees(employeesArray);
      setLeaveTypes(Array.isArray(leave_types) ? leave_types : []);
      setHolidayList(Array.isArray(holiday_infos) ? holiday_infos : []);

      // Ensure entries is an object
      const entriesObj = entries || {};
      setEntryList(entriesObj);

      const currentEmployeeEntries = {};
      currentEmployeeEntries[targetEmployeeId] = entriesObj;
      setAllEmployeesEntries(currentEmployeeEntries);
      setBootstrappedEmployeeId(targetEmployeeId);
      setRuntimeError("");
      setLoading(false);

      return true;
    } catch (error) {
      if (latestRequestKeyRef.current !== activeRequestKey) return false;

      Logger.error(error);
      setRuntimeError("Unable to load time tracking right now.");
      setLoading(false);

      return false;
    }
  };

  const fetchEntriesOfMonths = (employeeId?: number, requestKey?: string) => {
    const firstDateOfTheMonth = `${currentYear}-${currentMonthNumber + 1}-01`;
    const startOfTheMonth = dayjs(firstDateOfTheMonth).format(dateFormat);
    const endOfTheMonth = dayjs(firstDateOfTheMonth)
      .endOf("month")
      .format(dateFormat);

    // API expects DD-MM-YYYY format
    const from = dayjs(startOfTheMonth)
      .subtract(1, "month")
      .format("DD-MM-YYYY");
    const to = dayjs(endOfTheMonth).add(1, "month").format("DD-MM-YYYY");

    return fetchEntries(from, to, employeeId, requestKey);
  };

  // View is always "day" by default, user can change it manually

  useEffect(() => {
    handleWeekInfo();
  }, [weekDay]);

  useEffect(() => {
    parseWeeklyViewData();
    calculateTotalHours();
  }, [weekDay, entryList]);

  useEffect(() => {
    setIsWeeklyEditing(false);
  }, []);

  useEffect(() => {
    if (updateView) {
      setSelectedFullDate(
        dayjs()
          .weekday(weekDay + selectDate)
          .format("YYYY-MM-DD")
      );
    }
  }, [selectDate, weekDay, updateView]);

  useEffect(() => {
    if (!selectedEmployeeId) return;

    const loadVisibleRange = async () => {
      if (view === "month") {
        const firstDateOfTheMonth = `${currentYear}-${
          currentMonthNumber + 1
        }-01`;
        const startOfTheMonth = dayjs(firstDateOfTheMonth).format("DD-MM-YYYY");
        const endOfTheMonth = dayjs(firstDateOfTheMonth)
          .endOf("month")
          .format("DD-MM-YYYY");
        const rangeKey = `month:${selectedEmployeeId}:${currentYear}:${currentMonthNumber}`;

        if (bootstrappedEmployeeId !== selectedEmployeeId) {
          const didLoadRange = await fetchTimeTrackingData({
            employeeId: selectedEmployeeId,
            from: startOfTheMonth,
            to: endOfTheMonth,
            year: currentYear,
            requestKey: rangeKey,
          });
          if (didLoadRange) setLoadedRangeKey(rangeKey);

          return;
        }

        if (loadedRangeKey === rangeKey) return;

        const didLoadRange = await fetchEntriesOfMonths(
          selectedEmployeeId,
          rangeKey
        );
        if (didLoadRange) setLoadedRangeKey(rangeKey);

        return;
      }

      const firstDay = dayInfo[0]?.fullDate;
      const lastDay = dayInfo[6]?.fullDate;

      if (!firstDay || !lastDay) return;

      const rangeKey = `week:${selectedEmployeeId}:${firstDay}:${lastDay}`;

      if (bootstrappedEmployeeId !== selectedEmployeeId) {
        const didLoadRange = await fetchTimeTrackingData({
          employeeId: selectedEmployeeId,
          from: firstDay,
          to: lastDay,
          year: currentYear,
          requestKey: rangeKey,
        });
        if (didLoadRange) setLoadedRangeKey(rangeKey);

        return;
      }

      if (loadedRangeKey === rangeKey) return;

      const didLoadRange = await fetchEntries(
        firstDay,
        lastDay,
        selectedEmployeeId,
        rangeKey
      );
      if (didLoadRange) setLoadedRangeKey(rangeKey);
    };

    loadVisibleRange();
  }, [
    selectedEmployeeId,
    view,
    currentMonthNumber,
    currentYear,
    dayInfo[0]?.fullDate,
    dayInfo[6]?.fullDate,
    bootstrappedEmployeeId,
    loadedRangeKey,
  ]);

  const handleWeekTodayButton = () => {
    setSelectDate(0);
    setWeekDay(dayjs().weekday());
  };

  const handleWeekInfo = () => {
    const daysInWeek = Array.from(Array(7).keys()).map(weekCounter => {
      const dayjsObj = dayjs().weekday(weekCounter + weekDay);
      const [day, month, date, year] = dayjsObj["$d"].toString().split(" ");

      const fullDate = dayjs()
        .weekday(weekCounter + weekDay)
        .format(dateFormat);

      return {
        day,
        month,
        date,
        year,
        fullDate,
      };
    });
    setDayInfo(() => daysInWeek);
  };

  const fetchEntries = async (
    from: string,
    to: string,
    employeeId?: number,
    requestKey?: string
  ) => {
    const targetEmployeeId = employeeId || selectedEmployeeId || user.id;
    const formattedFrom = dayjs(from, dateParseFormats, true).isValid()
      ? dayjs(from, dateParseFormats, true).format("DD-MM-YYYY")
      : from;

    const formattedTo = dayjs(to, dateParseFormats, true).isValid()
      ? dayjs(to, dateParseFormats, true).format("DD-MM-YYYY")
      : to;

    const activeRequestKey =
      requestKey ||
      `range:${targetEmployeeId}:${formattedFrom}:${formattedTo}:${currentYear}`;

    try {
      latestRequestKeyRef.current = activeRequestKey;

      const res = await timeTrackingApi.getCurrentUserEntries(
        formattedFrom,
        formattedTo,
        currentYear,
        targetEmployeeId
      );

      if (latestRequestKeyRef.current !== activeRequestKey) return false;

      const entriesObj = res.data?.entries || {};
      setAllEmployeesEntries(pv => ({ ...pv, [targetEmployeeId]: entriesObj }));
      setEntryList(entriesObj);
      if (Array.isArray(res.data?.leave_types)) {
        setLeaveTypes(res.data.leave_types);
      }

      if (Array.isArray(res.data?.holiday_infos)) {
        setHolidayList(res.data.holiday_infos);
      }
      setRuntimeError("");
      setLoading(false);

      return true;
    } catch (error) {
      if (latestRequestKeyRef.current !== activeRequestKey) return false;

      Logger.error(error);
      setRuntimeError("Unable to load time tracking right now.");
      setLoading(false);

      return false;
    }
  };

  const refreshVisibleEntries = async (employeeId?: number) => {
    const targetEmployeeId = employeeId || selectedEmployeeId;

    if (view === "month") {
      const didLoadRange = await fetchEntriesOfMonths(targetEmployeeId);
      if (didLoadRange) {
        setLoadedRangeKey(
          `month:${targetEmployeeId}:${currentYear}:${currentMonthNumber}`
        );
      }

      return didLoadRange;
    }

    const firstDay = dayInfo[0]?.fullDate;
    const lastDay = dayInfo[6]?.fullDate;

    if (firstDay && lastDay) {
      const didLoadRange = await fetchEntries(
        firstDay,
        lastDay,
        targetEmployeeId
      );
      if (didLoadRange) {
        setLoadedRangeKey(`week:${targetEmployeeId}:${firstDay}:${lastDay}`);
      }

      return didLoadRange;
    }

    return false;
  };

  const handleFilterEntry = async (date: string, entryId: string | number) => {
    let filteredTimesheetEntry: object;
    const isoDate = normalizeEntryDateKey(date);
    const newValue = { ...entryList };

    // Check if entries exist for this date
    if (newValue[isoDate]) {
      newValue[isoDate] = newValue[isoDate].filter(e => {
        if (e["id"] == entryId) {
          filteredTimesheetEntry = e;

          return false; // Remove this entry
        }

        return true; // Keep this entry
      });
    }

    setAllEmployeesEntries(pv => ({ ...pv, [selectedEmployeeId]: newValue }));
    setEntryList(pv => ({ ...pv, ...newValue }));

    return filteredTimesheetEntry;
  };

  const handleRelocateEntry = async (date: string, entry: object) => {
    const isoDate = normalizeEntryDateKey(date);
    setEntryList(prevState => {
      const newState = { ...prevState };
      newState[isoDate] = newState[isoDate]
        ? [...newState[isoDate], entry]
        : [entry];

      setAllEmployeesEntries(pv => ({ ...pv, [selectedEmployeeId]: newState }));

      return newState;
    });
  };

  const handleDeleteEntry = async id => {
    const res = await timesheetEntryApi.destroy(id);
    if (!(res.status === 200)) return;
    await handleFilterEntry(selectedFullDate, id);

    // Refetch entries for the week to ensure data is up to date
    if (dayInfo.length > 0) {
      const firstDay = dayInfo[0]?.fullDate;
      const lastDay = dayInfo[6]?.fullDate;
      if (firstDay && lastDay) {
        fetchEntries(firstDay, lastDay);
      }
    }
  };

  const handleDeleteTimeoffEntry = async (
    id: number,
    leaveDate?: string | null
  ) => {
    const res = await timeoffEntriesApi.destroy(id);
    if (res.status !== 200) return;

    await handleFilterEntry(leaveDate || selectedFullDate, id);
    await refreshVisibleEntries();
  };

  const removeLocalStorageItems = () => {
    localStorage.removeItem("note");
    localStorage.removeItem("duration");
    localStorage.removeItem("client");
    localStorage.removeItem("project");
    localStorage.removeItem("projectId");
    localStorage.removeItem("billable");
    localStorage.removeItem("projectBillable");
  };

  const handleDuplicate = async id => {
    removeLocalStorageItems();
    if (!id) return;
    const currentEntries = getEntriesForDate(selectedFullDate);
    const entry = currentEntries.find(currentEntry => currentEntry.id === id);
    if (!entry) return;
    const data = {
      work_date: entry.work_date,
      duration: entry.duration,
      note: entry.note,
      bill_status:
        entry.bill_status == "billed" ? "unbilled" : entry.bill_status,
    };

    const res = await timesheetEntryApi.create(
      {
        project_id: entry.project_id,
        timesheet_entry: data,
      },
      selectedEmployeeId
    );
    if (res.status === 200) {
      await refreshVisibleEntries();
    }
  };

  const calculateTotalHours = () => {
    let total = 0;
    const dailyTotal = [];
    for (let weekCounter = 0; weekCounter < 7; weekCounter++) {
      const day = dayjs()
        .weekday(weekCounter + weekDay)
        .format(dateFormat);
      const entriesForDay = getEntriesForDate(day);
      if (entriesForDay.length > 0) {
        let dayTotal = 0;
        entriesForDay.forEach(e => {
          dayTotal += e.duration;
        });
        dailyTotal.push(minToHHMM(dayTotal));
        total += dayTotal;
      } else {
        dailyTotal.push("00:00");
      }
    }
    setDailyTotalHours(dailyTotal);
    setWeeklyTotalHours(minToHHMM(total));
  };

  const handleNextDay = () => {
    setWeekDay(p => p + 1);
  };

  const handlePreDay = () => {
    setWeekDay(p => p - 1);
  };

  const handleNextWeek = () => {
    setWeekDay(p => p + 7);
  };

  const handlePrevWeek = () => {
    setWeekDay(p => p - 7);
  };

  const parseWeeklyViewData = () => {
    const weekArr = [];
    for (let weekCounter = 0; weekCounter < 7; weekCounter++) {
      const date = dayjs()
        .weekday(weekDay + weekCounter)
        .format(dateFormat);
      const entriesForDay = getEntriesForDate(date);
      if (entriesForDay.length === 0) continue;
      entriesForDay.forEach(entry => {
        let entryAdded = false;
        weekArr.forEach(rowInfo => {
          if (
            rowInfo["projectId"] === entry["project_id"] &&
            !rowInfo["entries"][weekCounter] &&
            !entryAdded
          ) {
            rowInfo["entries"][weekCounter] = entry;
            entryAdded = true;
          }

          return rowInfo;
        });

        if (entryAdded) return;
        const newRow = [];
        newRow[weekCounter] = entry;
        weekArr.push({
          projectId: entry["project_id"],
          clientName: entry.client,
          projectName: entry.project,
          entries: newRow,
        });
      });
    }

    setWeeklyData(() => weekArr);
  };

  const handleAddEntryDateChange = date => {
    const date1 = dayjs(date).weekday(dayjs().weekday());
    const date2 = dayjs();

    const days = date1.diff(date2, "days");
    setWeekDay(days > 0 ? days + 1 : days); //The difference between selected date to current date is always comes 1 day less. This condition resolves that issue.
    setSelectDate(dayjs(date).weekday());
    setCurrentMonthNumber(dayjs(date).get("month"));
    setCurrentYear(dayjs(date).year());
  };

  const handleOpenTimeoffForm = () => {
    setEditEntryId(0);
    setEditTimeoffEntryId(0);
    setNewEntryView(false);
    setNewTimeoffEntryView(true);
  };

  const handleTimerSaved = async () => {
    await refreshVisibleEntries();
  };

  const handleResumeTimer = ({
    client,
    project,
    projectId,
    note,
  }: {
    client: string;
    project: string;
    projectId: number;
    note?: string;
  }) => {
    startTimerFromEntry({
      client,
      project,
      projectId,
      description: note,
    });
    setTimerSyncKey(current => current + 1);
    setResumeTimerEntry({
      client,
      project,
      projectId,
      description: note,
      resumeAt: Date.now(),
    });
    Toastr.success("Timer resumed from entry");
  };

  const handleCopyLastWeek = async () => {
    if (view !== "week" || dayInfo.length === 0) return;

    const currentWeekStart = dayjs(
      dayInfo[0]?.fullDate,
      dateParseFormats,
      true
    );

    if (!currentWeekStart.isValid()) return;

    try {
      setCopyingLastWeek(true);

      const previousWeekStart = currentWeekStart.subtract(7, "day");
      const previousWeekEnd = previousWeekStart.add(6, "day");
      const response = await timesheetEntryApi.list(
        previousWeekStart.format("YYYY-MM-DD"),
        previousWeekEnd.format("YYYY-MM-DD"),
        selectedEmployeeId
      );

      const previousWeekEntries = Object.values(
        response.data?.entries || {}
      ).flat();

      if (!previousWeekEntries.length) {
        Toastr.warning("No entries found in last week.");

        return;
      }

      const currentEntriesByDate = Object.entries(entryList || {}).reduce(
        (accumulator, [date, entries]: [string, any[]]) => {
          const normalizedDate = dayjs(date, dateParseFormats, true).isValid()
            ? dayjs(date, dateParseFormats, true).format("YYYY-MM-DD")
            : date;

          accumulator[normalizedDate] = entries || [];

          return accumulator;
        },
        {}
      );

      const entriesToCreate = previousWeekEntries.filter((entry: any) => {
        const targetDate = dayjs(entry.work_date)
          .add(7, "day")
          .format("YYYY-MM-DD");
        const matchingEntries = currentEntriesByDate[targetDate] || [];

        return !matchingEntries.some(
          (currentEntry: any) =>
            currentEntry.project_id === entry.project_id &&
            currentEntry.duration === entry.duration &&
            (currentEntry.note || "") === (entry.note || "") &&
            (currentEntry.task_type || "development") ===
              (entry.task_type || "development")
        );
      });

      if (!entriesToCreate.length) {
        Toastr.warning("This week already has those entries.");

        return;
      }

      await Promise.all(
        entriesToCreate.map((entry: any) =>
          timesheetEntryApi.create(
            {
              project_id: entry.project_id,
              timesheet_entry: {
                work_date: dayjs(entry.work_date)
                  .add(7, "day")
                  .format("YYYY-MM-DD"),
                duration: entry.duration,
                note: entry.note,
                task_type: entry.task_type || "development",
                bill_status:
                  entry.bill_status === "billed"
                    ? "unbilled"
                    : entry.bill_status,
              },
            },
            selectedEmployeeId
          )
        )
      );

      await refreshVisibleEntries();
      Toastr.success(`Copied ${entriesToCreate.length} entries from last week`);
    } catch (error) {
      Logger.error(error);
      Toastr.error("Failed to copy last week's entries.");
    } finally {
      setCopyingLastWeek(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (runtimeError) {
    return (
      <div
        className="p-6 text-sm text-red-600"
        data-testid="time-tracking-runtime-error"
      >
        {runtimeError}
      </div>
    );
  }

  const TimeTrackingContent = () => (
    <TimesheetEntriesContext.Provider
      value={{
        entryList,
        selectedFullDate,
        setUpdateView,
        setNewTimeoffEntryView,
        selectedEmployeeId,
        fetchEntries,
        fetchEntriesOfMonths,
        handleAddEntryDateChange,
        refreshVisibleEntries,
        editTimeoffEntryId,
        setEditTimeoffEntryId,
        handleFilterEntry,
        handleRelocateEntry,
        setSelectedFullDate,
        holidayList,
        holidaysHashObj,
        hasNationalHoliday,
        hasOptionalHoliday,
        leaveTypes,
        setLeaveTypes,
        editEntryId,
        newEntryView,
        setEditEntryId,
        setNewEntryView,
        isDesktop,
      }}
    >
      <div className="pb-14">
        <div className="mt-0 h-full p-4 lg:mt-6 lg:p-0">
          <div className="mb-6 flex items-center justify-between">
            {isDesktop && (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-muted-foreground">
                  Log work by week or month. Keep entries clear and current.
                </p>
              </div>
            )}
            {!isDesktop && isAdminUser && (
              <h3 className="text-lg font-bold leading-6 text-foreground">
                Time entries for
              </h3>
            )}
            {isAdminUser && employeeOptions.length > 0 && (
              <SearchTimeEntries
                employeeList={employeeOptions}
                selectedEmployeeId={selectedEmployeeId}
                setSelectedEmployeeId={setSelectedEmployeeId}
              />
            )}
            {!isAdminUser && user && (
              <div className="text-sm text-muted-foreground">
                Entries for {user.first_name} {user.last_name}
              </div>
            )}
          </div>
          <div>
            <div className="mb-4 flex items-center gap-2" role="tablist">
              {["week", "month"].map(currentView => (
                <Button
                  key={currentView}
                  variant={view === currentView ? "default" : "outline"}
                  size="sm"
                  data-view={currentView}
                  onClick={() => {
                    setView(currentView);
                    localStorage.setItem("timeTrackingView", currentView);
                  }}
                >
                  {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
                </Button>
              ))}
            </div>
            <div className="mb-6 week-view" data-view={view}>
              {view === "week" && (
                <Header
                  dailyTotalHours={dailyTotalHours}
                  dayInfo={dayInfo}
                  handleAddEntryDateChange={handleAddEntryDateChange}
                  handleNextDay={handleNextDay}
                  handleNextWeek={handleNextWeek}
                  handlePreDay={handlePreDay}
                  handlePrevWeek={handlePrevWeek}
                  selectDate={selectDate}
                  selectedFullDate={selectedFullDate}
                  setSelectDate={setSelectDate}
                  setWeekDay={setWeekDay}
                  weeklyTotalHours={weeklyTotalHours}
                />
              )}
              {isDesktop && (
                <FloatingTimer
                  onSaveEntry={handleTimerSaved}
                  placement="inline"
                  externalSyncKey={timerSyncKey}
                  resumeFromEntry={resumeTimerEntry}
                />
              )}
              {view === "week" && (
                <WeekDaySelector
                  dayInfo={dayInfo}
                  selectDate={selectDate}
                  setSelectDate={index => {
                    setSelectDate(index);
                    const selectedDayInfo = dayInfo[index];
                    if (selectedDayInfo) {
                      const formattedDate = dayjs(
                        selectedDayInfo.fullDate,
                        dateFormat
                      ).format("YYYY-MM-DD");
                      setSelectedFullDate(formattedDate);
                    }
                  }}
                />
              )}
              {view === "month" && (
                <MonthCalendar
                  selectedFullDate={selectedFullDate}
                  setSelectedFullDate={setSelectedFullDate}
                  entryList={entryList}
                  handleWeekTodayButton={handleWeekTodayButton}
                  monthsAbbr={monthsAbbr}
                  setWeekDay={setWeekDay}
                  setSelectDate={setSelectDate}
                  currentMonthNumber={currentMonthNumber}
                  setCurrentMonthNumber={setCurrentMonthNumber}
                  currentYear={currentYear}
                  setCurrentYear={setCurrentYear}
                  dayInfo={dayInfo}
                  setUpdateView={setUpdateView}
                />
              )}
            </div>
            {(editEntryId || newEntryView) && (
              <EntryForm
                clients={clients}
                editEntryId={editEntryId}
                entryList={entryList}
                refreshVisibleEntries={refreshVisibleEntries}
                handleAddEntryDateChange={handleAddEntryDateChange}
                handleDeleteEntry={handleDeleteEntry}
                handleFilterEntry={handleFilterEntry}
                handleRelocateEntry={handleRelocateEntry}
                projects={projects}
                removeLocalStorageItems={removeLocalStorageItems}
                selectedEmployeeId={selectedEmployeeId}
                selectedFullDate={selectedFullDate}
                setEditEntryId={setEditEntryId}
                setNewEntryView={setNewEntryView}
                setSelectedFullDate={setSelectedFullDate}
                setUpdateView={setUpdateView}
              />
            )}
            {newTimeoffEntryView && (
              <TimeoffForm
                isDisplayEditTimeoffEntryForm={Boolean(editTimeoffEntryId)}
              />
            )}
            <AddEntryButton
              copyingLastWeek={copyingLastWeek}
              handleCopyLastWeek={handleCopyLastWeek}
              newEntryView={newEntryView}
              newTimeoffEntryView={newTimeoffEntryView}
              handleOpenTimeoffForm={handleOpenTimeoffForm}
              setNewEntryView={setNewEntryView}
              showCopyLastWeek={isDesktop && view === "week"}
            />
            {newRowView && (
              <WeeklyEntries
                clientName=""
                clients={clients}
                dayInfo={dayInfo}
                entries={[]}
                entryList={entryList}
                isWeeklyEditing={isWeeklyEditing}
                key={0}
                newRowView={newRowView}
                projectId={null}
                projectName=""
                projects={projects}
                selectedEmployeeId={selectedEmployeeId}
                setEntryList={setEntryList}
                setIsWeeklyEditing={setIsWeeklyEditing}
                setNewRowView={setNewRowView}
                setWeeklyData={setWeeklyData}
                weeklyData={weeklyData}
              />
            )}
          </div>
          {(view === "week" || view === "month" || !isDesktop) && (
            <div className="mt-4" data-view={view}>
              <TimeEntriesDisplay
                selectedFullDate={selectedFullDate}
                entryList={entryList}
                leaveTypeHashObj={leaveTypeHashObj}
                holidaysHashObj={holidaysHashObj}
                handleDeleteEntry={handleDeleteEntry}
                handleDeleteTimeoffEntry={handleDeleteTimeoffEntry}
                handleDuplicate={handleDuplicate}
                handleResumeTimer={handleResumeTimer}
                setEditEntryId={setEditEntryId}
                setEditTimeoffEntryId={setEditTimeoffEntryId}
                setNewEntryView={setNewEntryView}
                setNewTimeoffEntryView={setNewTimeoffEntryView}
                setSelectedFullDate={setSelectedFullDate}
                dayInfo={dayInfo}
                view={view}
                hideEmptyState={newEntryView || newTimeoffEntryView}
              />
            </div>
          )}
        </div>
        <EntryDetailsModal
          isOpen={showEntryModal}
          onClose={() => {
            setShowEntryModal(false);
            setNewEntryView(false);
            setEditEntryId(0);
          }}
          selectedDate={modalSelectedDate}
          entries={getEntriesForDate(modalSelectedDate)}
          editEntryId={editEntryId}
          setEditEntryId={setEditEntryId}
          handleDeleteEntry={handleDeleteEntry}
          handleDuplicate={handleDuplicate}
          handleResumeTimer={handleResumeTimer}
          setNewEntryView={setNewEntryView}
          newEntryView={newEntryView}
          // Form props
          clients={clients}
          projects={projects}
          entryList={entryList}
          fetchEntries={fetchEntries}
          fetchEntriesofMonth={fetchEntriesOfMonths}
          refreshVisibleEntries={refreshVisibleEntries}
          handleAddEntryDateChange={handleAddEntryDateChange}
          handleFilterEntry={handleFilterEntry}
          handleRelocateEntry={handleRelocateEntry}
          removeLocalStorageItems={removeLocalStorageItems}
          selectedEmployeeId={selectedEmployeeId}
          setSelectedFullDate={setSelectedFullDate}
          setUpdateView={setUpdateView}
        />
        {!isDesktop && (
          <FloatingTimer
            onSaveEntry={handleTimerSaved}
            externalSyncKey={timerSyncKey}
            resumeFromEntry={resumeTimerEntry}
          />
        )}
      </div>
    </TimesheetEntriesContext.Provider>
  );

  const Main = withLayout(TimeTrackingContent, !isDesktop, !isDesktop);

  return isDesktop ? TimeTrackingContent() : <Main />;
};

interface Iprops {
  isAdminUser: boolean;
  user: any;
}

export default TimeTracking;
