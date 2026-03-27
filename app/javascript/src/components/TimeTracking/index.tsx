import React, { useEffect, useState } from "react";

import { timesheetEntryApi, timeTrackingApi } from "apis/api";
import Loader from "common/Loader/index";
import withLayout from "common/Mobile/HOC/withLayout";
import SearchTimeEntries from "common/SearchTimeEntries";
import { useUserContext } from "context/UserContext";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import updateLocale from "dayjs/plugin/updateLocale";
import weekday from "dayjs/plugin/weekday";
import { minFromHHMM, minToHHMM } from "helpers";
import Logger from "js-logger";
import { sendGAPageView } from "utils/googleAnalytics";
import { Button } from "../ui/button";
import FloatingTimer from "../TimesheetEntries/FloatingTimer";

import WeekDaySelector from "./WeekDaySelector";
import EntryForm from "./EntryForm";
import { ModernTimeEntryForm } from "./ModernTimeEntryForm";
import Header from "./Header";
import WeeklyEntries from "./WeeklyEntries";
import EntryDetailsModal from "./EntryDetailsModal";
import TimeEntriesDisplay from "./TimeEntriesDisplay";
import AddEntryButton from "./AddEntryButton";
import MonthCalender from "./MonthCalender";

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
  const [currentMonthNumber, setCurrentMonthNumber] = useState<number>(
    dayjs().month()
  );
  const [currentYear, setCurrentYear] = useState<number>(dayjs().year());
  const [updateView, setUpdateView] = useState(true);
  const [showModernForm, setShowModernForm] = useState<boolean>(false);
  const [modernFormEntry, setModernFormEntry] = useState<any>(null);
  const [showEntryModal, setShowEntryModal] = useState<boolean>(false);
  const [modalSelectedDate, setModalSelectedDate] = useState<string>("");
  const [view, setView] = useState<string>("week");
  const [runtimeError, setRuntimeError] = useState<string>("");
  const [bootstrappedEmployeeId, setBootstrappedEmployeeId] = useState<
    number | null
  >(null);
  const [loadedRangeKey, setLoadedRangeKey] = useState<string>("");
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
  }: {
    employeeId?: number;
    from?: string;
    to?: string;
    year?: number | string;
  } = {}) => {
    try {
      const targetEmployeeId = employeeId || selectedEmployeeId || user.id;
      const { data } = await timeTrackingApi.get({
        userId: targetEmployeeId,
        from,
        to,
        year,
      });
      const { clients, projects, entries, employees } = data;

      // Ensure clients is an array
      const clientsArray = Array.isArray(clients) ? clients : [];
      setClients(clientsArray);

      // Ensure projects is an object keyed by client name
      const projectsObj = projects || {};
      setProjects(projectsObj);

      // Ensure employees is an array
      const employeesArray = Array.isArray(employees) ? employees : [];
      setEmployees(employeesArray);

      // Ensure entries is an object
      const entriesObj = entries || {};
      setEntryList(entriesObj);

      const currentEmployeeEntries = {};
      currentEmployeeEntries[targetEmployeeId] = entriesObj;
      setAllEmployeesEntries(currentEmployeeEntries);
      setBootstrappedEmployeeId(targetEmployeeId);
      setRuntimeError("");
      setLoading(false);
    } catch (error) {
      Logger.error(error);
      setRuntimeError("Unable to load time tracking right now.");
      setLoading(false);
    }
  };

  const fetchEntriesOfMonths = (employeeId?: number) => {
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

    return fetchEntries(from, to, employeeId);
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
          await fetchTimeTrackingData({
            employeeId: selectedEmployeeId,
            from: startOfTheMonth,
            to: endOfTheMonth,
            year: currentYear,
          });
          setLoadedRangeKey(rangeKey);

          return;
        }

        if (loadedRangeKey === rangeKey) return;

        await fetchEntriesOfMonths(selectedEmployeeId);
        setLoadedRangeKey(rangeKey);

        return;
      }

      const firstDay = dayInfo[0]?.fullDate;
      const lastDay = dayInfo[6]?.fullDate;

      if (!firstDay || !lastDay) return;

      const rangeKey = `week:${selectedEmployeeId}:${firstDay}:${lastDay}`;

      if (bootstrappedEmployeeId !== selectedEmployeeId) {
        await fetchTimeTrackingData({
          employeeId: selectedEmployeeId,
          from: firstDay,
          to: lastDay,
          year: currentYear,
        });
        setLoadedRangeKey(rangeKey);

        return;
      }

      if (loadedRangeKey === rangeKey) return;

      await fetchEntries(firstDay, lastDay, selectedEmployeeId);
      setLoadedRangeKey(rangeKey);
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
    employeeId?: number
  ) => {
    try {
      const targetEmployeeId = employeeId || selectedEmployeeId || user.id;
      const formattedFrom = dayjs(from, dateParseFormats, true).isValid()
        ? dayjs(from, dateParseFormats, true).format("DD-MM-YYYY")
        : from;

      const formattedTo = dayjs(to, dateParseFormats, true).isValid()
        ? dayjs(to, dateParseFormats, true).format("DD-MM-YYYY")
        : to;

      const res = await timeTrackingApi.getCurrentUserEntries(
        formattedFrom,
        formattedTo,
        currentYear,
        targetEmployeeId
      );
      const entriesObj = res.data?.entries || {};
      setAllEmployeesEntries(pv => ({ ...pv, [targetEmployeeId]: entriesObj }));
      setEntryList(entriesObj);
      setRuntimeError("");
      setLoading(false);

      return res;
    } catch (error) {
      Logger.error(error);
      setRuntimeError("Unable to load time tracking right now.");
      setLoading(false);
    }
  };

  const refreshVisibleEntries = async (employeeId?: number) => {
    const targetEmployeeId = employeeId || selectedEmployeeId;

    if (view === "month") {
      await fetchEntriesOfMonths(targetEmployeeId);
      setLoadedRangeKey(
        `month:${targetEmployeeId}:${currentYear}:${currentMonthNumber}`
      );

      return true;
    }

    const firstDay = dayInfo[0]?.fullDate;
    const lastDay = dayInfo[6]?.fullDate;

    if (firstDay && lastDay) {
      await fetchEntries(firstDay, lastDay, targetEmployeeId);
      setLoadedRangeKey(`week:${targetEmployeeId}:${firstDay}:${lastDay}`);

      return true;
    }

    return false;
  };

  const handleFilterEntry = async (date: string, entryId: string | number) => {
    let filteredTimesheetEntry: object;
    // Convert date to ISO format for entry lookup
    const isoDate = dayjs(date, dateFormat).format("YYYY-MM-DD");
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
    // Convert date to ISO format for entry storage
    const isoDate = dayjs(date, dateFormat).format("YYYY-MM-DD");
    setEntryList(prevState => {
      const newState = { ...prevState };
      newState[isoDate] = newState[isoDate]
        ? [...newState[isoDate], entry]
        : [entry];

      return newState;
    });
    setAllEmployeesEntries(pv => ({ ...pv, [selectedEmployeeId]: entryList }));
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

  const handleOpenModernForm = (entry = null) => {
    setModernFormEntry(entry);
    setShowModernForm(true);
  };

  const handleCloseModernForm = () => {
    setShowModernForm(false);
    setModernFormEntry(null);
  };

  const handleSaveModernEntry = async (formData: any) => {
    try {
      const payload = {
        work_date: formData.date,
        duration: minFromHHMM(formData.duration),
        note: formData.note,
        bill_status: formData.billable ? "unbilled" : "non_billable",
      };

      if (modernFormEntry) {
        // Update existing entry
        const res = await timesheetEntryApi.update(modernFormEntry.id, {
          project_id: formData.projectId,
          timesheet_entry: payload,
        });
        if (res.status >= 200 && res.status < 300) {
          await refreshVisibleEntries();
        }
      } else {
        // Create new entry
        const res = await timesheetEntryApi.create(
          {
            project_id: formData.projectId,
            timesheet_entry: payload,
          },
          selectedEmployeeId
        );
        if (res.status === 200) {
          await refreshVisibleEntries();
        }
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      throw error;
    }
  };

  const handleTimerSaved = async () => {
    await refreshVisibleEntries();
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

  const TimeTrackingLayout = () => (
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
              <MonthCalender
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
          <AddEntryButton
            newEntryView={newEntryView}
            handleOpenModernForm={handleOpenModernForm}
            setNewEntryView={setNewEntryView}
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
              handleDeleteEntry={handleDeleteEntry}
              handleDuplicate={handleDuplicate}
              setEditEntryId={setEditEntryId}
              setNewEntryView={setNewEntryView}
            />
          </div>
        )}
      </div>
      <ModernTimeEntryForm
        isOpen={showModernForm}
        onClose={handleCloseModernForm}
        onSave={handleSaveModernEntry}
        selectedDate={dayjs(selectedFullDate).toDate()}
        existingEntry={modernFormEntry}
        projects={Object.values(projects).flat()}
        clients={clients}
      />

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
      <FloatingTimer onSaveEntry={handleTimerSaved} />
    </div>
  );

  const Main = withLayout(TimeTrackingLayout, !isDesktop, !isDesktop);

  return isDesktop ? TimeTrackingLayout() : <Main />;
};

interface Iprops {
  isAdminUser: boolean;
  user: any;
}

export default TimeTracking;
