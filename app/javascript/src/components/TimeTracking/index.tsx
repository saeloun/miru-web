import React, { useEffect, useState } from "react";

import timesheetEntryApi from "apis/timesheet-entry";
import timeTrackingApi from "apis/timeTracking";
import Loader from "common/Loader/index";
import withLayout from "common/Mobile/HOC/withLayout";
import SearchTimeEntries from "common/SearchTimeEntries";
import { useUserContext } from "context/UserContext";
import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import weekday from "dayjs/plugin/weekday";
import { minToHHMM } from "helpers";
import Logger from "js-logger";
import { sendGAPageView } from "utils/googleAnalytics";

import DatesInWeek from "./DatesInWeek";
import { EmptyStatesMobileView } from "./EmptyStatesMobileView";
import EntryCard from "./EntryCard";
import EntryForm from "./EntryForm";
import Header from "./Header";
import MonthCalender from "./MonthCalender";
import WeeklyEntries from "./WeeklyEntries";

dayjs.extend(updateLocale);
dayjs.extend(weekday);

const monthsAbbr = "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_");
dayjs.updateLocale("en", { monthShort: monthsAbbr });

// Day start from monday
dayjs.Ls.en.weekStart = 1;

const TimeTracking: React.FC<Iprops> = ({ user, isAdminUser }) => {
  const [dayInfo, setDayInfo] = useState<any[]>([]);
  const [view, setView] = useState<string>("month");
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
  const { isDesktop } = useUserContext();
  const employeeOptions = employees.map(e => ({
    value: `${e["id"]}`,
    label: `${e["first_name"]} ${e["last_name"]}`,
  }));

  useEffect(() => {
    sendGAPageView();
    fetchTimeTrackingData();
    if (!isDesktop) {
      setView("day");
    }
  }, []);

  const fetchTimeTrackingData = async () => {
    try {
      const { data } = await timeTrackingApi.get();
      const { clients, projects, entries, employees } = data;

      setClients(clients);
      setProjects(projects);
      setEmployees(employees);
      setEntryList(entries);
      const currentEmployeeEntries = {};
      currentEmployeeEntries[user.id] = entries;
      setAllEmployeesEntries(currentEmployeeEntries);
      setLoading(false);
    } catch (error) {
      Logger.error(error);
      setLoading(false);
    }
  };

  const fetchEntriesOfMonths = () => {
    const firstDateOfTheMonth = `${currentYear}-${currentMonthNumber + 1}-01`;
    const startOfTheMonth = dayjs(firstDateOfTheMonth).format("YYYY-MM-DD");
    const endOfTheMonth = dayjs(firstDateOfTheMonth)
      .endOf("month")
      .format("YYYY-MM-DD");

    fetchEntries(
      dayjs(startOfTheMonth).subtract(1, "month").format("DD-MM-YYYY"),
      dayjs(endOfTheMonth).add(1, "month").format("DD-MM-YYYY")
    );
  };

  useEffect(() => {
    if (!isDesktop) {
      setView("day");
    }
  }, [isDesktop]);

  useEffect(() => {
    handleWeekInfo();
  }, [weekDay]);

  useEffect(() => {
    if (view === "month") return;
    parseWeeklyViewData();
    calculateTotalHours();
  }, [weekDay, entryList, view]);

  useEffect(() => {
    setIsWeeklyEditing(false);
  }, [view]);

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
    if (dayInfo.length <= 0) return;
    fetchEntriesOfMonths();
  }, [selectedEmployeeId]);

  const handleWeekTodayButton = () => {
    setSelectDate(0);
    setWeekDay(dayjs().weekday());
  };

  const handleWeekInfo = () => {
    const daysInWeek = Array.from(Array(7).keys()).map(weekCounter => {
      const [day, month, date, year] = dayjs()
        .weekday(weekCounter + weekDay)
        ["$d"].toString()
        .split(" ");

      const fullDate = dayjs()
        .weekday(weekCounter + weekDay)
        .format("YYYY-MM-DD");

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

  const fetchEntries = async (from: string, to: string) => {
    try {
      const res = await timesheetEntryApi.list(from, to, selectedEmployeeId);
      if (res.status >= 200 && res.status < 300) {
        const allEntries = { ...allEmployeesEntries };
        allEntries[selectedEmployeeId] = {
          ...allEntries[selectedEmployeeId],
          ...res.data.entries,
        };
        setAllEmployeesEntries(allEntries);
        setEntryList(allEntries[selectedEmployeeId]);
      }
      setLoading(false);

      return res;
    } catch (error) {
      Logger.error(error);
      setLoading(false);
    }
  };

  const handleFilterEntry = async (date: string, entryId: string | number) => {
    let filteredTimesheetEntry: object;
    const filteredDate = dayjs(date).format("YYYY-MM-DD");
    const newValue = { ...entryList };
    newValue[filteredDate] = newValue[filteredDate].filter(e => {
      if (e["id"] == entryId) {
        filteredTimesheetEntry = e;
      } else {
        return e;
      }
    });
    setAllEmployeesEntries(pv => ({ ...pv, [selectedEmployeeId]: newValue }));
    setEntryList(pv => ({ ...pv, ...newValue }));

    return filteredTimesheetEntry;
  };

  const handleRelocateEntry = async (date: string, entry: object) => {
    const filteredDate = dayjs(date).format("YYYY-MM-DD");
    setEntryList(prevState => {
      const newState = { ...prevState };
      newState[filteredDate] = newState[filteredDate]
        ? [...newState[filteredDate], entry]
        : [entry];

      return newState;
    });
    setAllEmployeesEntries(pv => ({ ...pv, [selectedEmployeeId]: entryList }));
  };

  const handleDeleteEntry = async id => {
    const res = await timesheetEntryApi.destroy(id);
    if (!(res.status === 200)) return;
    await handleFilterEntry(selectedFullDate, id);
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
    const entry = entryList[selectedFullDate].find(entry => entry.id === id);
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
      await fetchEntries(selectedFullDate, selectedFullDate);
      await fetchEntriesOfMonths();
    }
  };

  const calculateTotalHours = () => {
    let total = 0;
    const dailyTotal = [];
    for (let weekCounter = 0; weekCounter < 7; weekCounter++) {
      const day = dayjs()
        .weekday(weekCounter + weekDay)
        .format("YYYY-MM-DD");
      if (entryList && entryList[day]) {
        let dayTotal = 0;
        entryList[day].forEach(e => {
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
    const from = dayjs().weekday(weekDay).format("YYYY-MM-DD");

    const to = dayjs()
      .weekday(weekDay + 1)
      .format("YYYY-MM-DD");
    fetchEntries(from, to);
  };

  const handlePreDay = () => {
    setWeekDay(p => p - 1);

    const from = dayjs().weekday(weekDay).format("YYYY-MM-DD");

    const to = dayjs()
      .weekday(weekDay - 1)
      .format("YYYY-MM-DD");

    fetchEntries(from, to);
  };

  const handleNextWeek = () => {
    setWeekDay(p => p + 7);
    const from = dayjs()
      .weekday(weekDay + 7)
      .format("YYYY-MM-DD");

    const to = dayjs()
      .weekday(weekDay + 13)
      .format("YYYY-MM-DD");
    fetchEntries(from, to);
  };

  const handlePrevWeek = () => {
    setWeekDay(p => p - 7);
    const from = dayjs()
      .weekday(weekDay - 7)
      .format("YYYY-MM-DD");

    const to = dayjs()
      .weekday(weekDay - 1)
      .format("YYYY-MM-DD");
    fetchEntries(from, to);
  };

  const parseWeeklyViewData = () => {
    const weekArr = [];
    for (let weekCounter = 0; weekCounter < 7; weekCounter++) {
      const date = dayjs()
        .weekday(weekDay + weekCounter)
        .format("YYYY-MM-DD");

      if (!entryList || !entryList[date]) continue;

      entryList[date].forEach(entry => {
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

  if (loading) {
    return <Loader />;
  }

  const TimeTrackingLayout = () => (
    <div className="pb-14">
      {!isDesktop && (
        <Header
          currentMonthNumber={currentMonthNumber}
          currentYear={currentYear}
          dailyTotalHours={dailyTotalHours}
          dayInfo={dayInfo}
          handleAddEntryDateChange={handleAddEntryDateChange}
          handleNextDay={handleNextDay}
          handleNextWeek={handleNextWeek}
          handlePreDay={handlePreDay}
          handlePrevWeek={handlePrevWeek}
          monthsAbbr={monthsAbbr}
          selectDate={selectDate}
          selectedFullDate={selectedFullDate}
          setSelectDate={setSelectDate}
          setWeekDay={setWeekDay}
          view={view}
          weeklyTotalHours={weeklyTotalHours}
        />
      )}
      <div className="mt-0 h-full p-4 lg:mt-6 lg:p-0">
        <div className="mb-6 flex items-center justify-between">
          {isDesktop && (
            <nav className="flex">
              {["month", "week", "day"].map((item, index) => (
                <button
                  key={index}
                  className={
                    item === view
                      ? "mr-10 border-b-2 border-miru-han-purple-1000 text-lg font-bold tracking-widest text-miru-han-purple-1000"
                      : "mr-10 text-lg font-semibold tracking-widest text-miru-han-purple-600"
                  }
                  onClick={() => setView(item)}
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </nav>
          )}
          {!isDesktop && isAdminUser && (
            <label className="text-base font-semibold leading-5 text-miru-dark-purple-1000">
              Time entries for
            </label>
          )}
          {isAdminUser && selectedEmployeeId && (
            <SearchTimeEntries
              employeeList={employeeOptions}
              selectedEmployeeId={selectedEmployeeId}
              setSelectedEmployeeId={setSelectedEmployeeId}
            />
          )}
        </div>
        <div>
          {view === "month" ? (
            <MonthCalender
              currentMonthNumber={currentMonthNumber}
              currentYear={currentYear}
              dayInfo={dayInfo}
              entryList={entryList}
              fetchEntries={fetchEntries}
              handleWeekTodayButton={handleWeekTodayButton}
              monthsAbbr={monthsAbbr}
              selectedEmployeeId={selectedEmployeeId}
              selectedFullDate={selectedFullDate}
              setCurrentMonthNumber={setCurrentMonthNumber}
              setCurrentYear={setCurrentYear}
              setSelectDate={setSelectDate}
              setSelectedFullDate={setSelectedFullDate}
              setWeekDay={setWeekDay}
            />
          ) : (
            isDesktop && (
              <div className="mb-6">
                <Header
                  currentMonthNumber={currentMonthNumber}
                  currentYear={currentYear}
                  dailyTotalHours={dailyTotalHours}
                  dayInfo={dayInfo}
                  handleAddEntryDateChange={handleAddEntryDateChange}
                  handleNextDay={handleNextDay}
                  handleNextWeek={handleNextWeek}
                  handlePreDay={handlePreDay}
                  handlePrevWeek={handlePrevWeek}
                  monthsAbbr={monthsAbbr}
                  selectDate={selectDate}
                  selectedFullDate={selectedFullDate}
                  setSelectDate={setSelectDate}
                  setWeekDay={setWeekDay}
                  view={view}
                  weeklyTotalHours={weeklyTotalHours}
                />
                <DatesInWeek
                  dayInfo={dayInfo}
                  selectDate={selectDate}
                  setSelectDate={setSelectDate}
                  view={view}
                />
              </div>
            )
          )}
          {!editEntryId && newEntryView && view !== "week" && (
            <EntryForm
              clients={clients}
              editEntryId={editEntryId}
              entryList={entryList}
              fetchEntries={fetchEntries}
              fetchEntriesofMonth={fetchEntriesOfMonths}
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
          {view !== "week" && !newEntryView && isDesktop && (
            <button
              className="flex h-10 w-full items-center justify-center rounded border-2 border-miru-han-purple-600 p-2 text-xl font-bold tracking-widest text-miru-han-purple-600 lg:h-14 lg:p-4"
              onClick={() => {
                setNewEntryView(true);
                setEditEntryId(0);
              }}
            >
              + NEW ENTRY
            </button>
          )}
          {/* --- On mobile view we don't need New Entry button for Empty States --- */}
          {view !== "week" &&
            !newEntryView &&
            !isDesktop &&
            entryList[selectedFullDate] && (
              <button
                className="flex h-10 w-full items-center justify-center rounded border-2 border-miru-han-purple-600 p-2 text-xl font-bold tracking-widest text-miru-han-purple-600 lg:h-14 lg:p-4"
                onClick={() => {
                  setNewEntryView(true);
                  setEditEntryId(0);
                }}
              >
                + NEW ENTRY
              </button>
            )}
          {/* --- weekly view --- */}
          {view === "week" && !newRowView && (
            <button
              className="h-14 w-full border-2 border-miru-han-purple-600 p-4 text-xl font-bold tracking-widest text-miru-han-purple-600"
              onClick={() => setNewRowView(true)}
            >
              + NEW ROW
            </button>
          )}
          {view === "week" && newRowView && (
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
        {/* entry cards for day and month */}
        {view !== "week" &&
          entryList[selectedFullDate] &&
          entryList[selectedFullDate].map((entry, weekCounter) =>
            editEntryId === entry.id ? (
              <EntryForm
                clients={clients}
                editEntryId={editEntryId}
                entryList={entryList}
                fetchEntries={fetchEntries}
                fetchEntriesofMonth={fetchEntriesOfMonths}
                handleAddEntryDateChange={handleAddEntryDateChange}
                handleDeleteEntry={handleDeleteEntry}
                handleFilterEntry={handleFilterEntry}
                handleRelocateEntry={handleRelocateEntry}
                key={entry.id}
                projects={projects}
                removeLocalStorageItems={removeLocalStorageItems}
                selectedEmployeeId={selectedEmployeeId}
                selectedFullDate={selectedFullDate}
                setEditEntryId={setEditEntryId}
                setNewEntryView={setNewEntryView}
                setSelectedFullDate={setSelectedFullDate}
                setUpdateView={setUpdateView}
              />
            ) : (
              <EntryCard
                handleDeleteEntry={handleDeleteEntry}
                handleDuplicate={handleDuplicate}
                key={weekCounter}
                setEditEntryId={setEditEntryId}
                setNewEntryView={setNewEntryView}
                {...entry}
              />
            )
          )}
        {/* mobile view Empty state condition */}
        {view !== "week" && !entryList[selectedFullDate] && !isDesktop && (
          <EmptyStatesMobileView
            setEditEntryId={setEditEntryId}
            setNewEntryView={setNewEntryView}
          />
        )}
        {/* entry cards for week */}
        {view === "week" && (
          <div>
            {weeklyData.map((entry, weekCounter) => (
              <WeeklyEntries
                key={weekCounter + 1}
                {...entry}
                clients={clients}
                dayInfo={dayInfo}
                entryList={entryList}
                isWeeklyEditing={isWeeklyEditing}
                newRowView={newRowView}
                parseWeeklyViewData={parseWeeklyViewData}
                projects={projects}
                selectedEmployeeId={selectedEmployeeId}
                setEntryList={setEntryList}
                setIsWeeklyEditing={setIsWeeklyEditing}
                setNewRowView={setNewRowView}
              />
            ))}
          </div>
        )}
      </div>
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
