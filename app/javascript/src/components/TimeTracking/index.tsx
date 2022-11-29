/* eslint-disable no-unexpected-multiline */
import React, { useEffect, useState } from "react";

import * as dayjs from "dayjs";
import * as updateLocale from "dayjs/plugin/updateLocale";
import * as weekday from "dayjs/plugin/weekday";
import { minToHHMM } from "helpers";
import Logger from "js-logger";
import { ToastContainer } from "react-toastify";

import timesheetEntryApi from "apis/timesheet-entry";
import timeTrackingApi from "apis/timeTracking";
import SearchTimeEntries from "common/SearchTimeEntries";
import { TOASTER_DURATION } from "constants/index";
import { sendGAPageView } from "utils/googleAnalytics";

import AddEntry from "./AddEntry";
import DatesInWeek from "./DatesInWeek";
import EntryCard from "./EntryCard";
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

  const employeeOptions = employees.map(e => ({
    value: `${e["id"]}`,
    label: `${e["first_name"]} ${e["last_name"]}`,
  }));

  useEffect(() => {
    sendGAPageView();
    fetchTimeTrackingData();
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
    } catch (error) {
      Logger.error(error);
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
    handleWeekInfo();
  }, [weekDay]);

  useEffect(() => {
    if (view === "month") return;
    parseWeeklyViewData();
    calculateTotalHours();
  }, [weekDay, entryList]);

  useEffect(() => {
    setIsWeeklyEditing(false);
  }, [view]);

  useEffect(() => {
    setSelectedFullDate(
      dayjs()
        .weekday(weekDay + selectDate)
        .format("YYYY-MM-DD")
    );
  }, [selectDate, weekDay]);

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

      return res;
    } catch (error) {
      Logger.error(error);
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

  const calculateTotalHours = () => {
    let total = 0;
    const dailyTotal = [];
    for (let weekCounter = 0; weekCounter < 7; weekCounter++) {
      const day = dayjs()
        .weekday(weekCounter + weekDay)
        .format("YYYY-MM-DD");
      if (entryList[day]) {
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

      if (!entryList[date]) continue;

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

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <div className="mt-6">
        <div className="mb-6 flex items-center justify-between">
          <nav className="flex">
            {["month", "week", "day"].map((item, index) => (
              <button
                key={index}
                className={
                  item === view
                    ? "mr-10 border-b-2 border-miru-han-purple-1000 font-bold tracking-widest text-miru-han-purple-1000"
                    : "mr-10 font-medium tracking-widest text-miru-han-purple-600"
                }
                onClick={() => setView(item)}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </nav>
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
            <div className="mb-6">
              <div className="flex h-10 w-full items-center justify-between bg-miru-han-purple-1000">
                <button
                  className="ml-4 flex h-6 w-20 items-center justify-center rounded border-2 text-xs font-bold tracking-widest text-white"
                  onClick={() => {
                    setWeekDay(0);
                    setSelectDate(dayjs().weekday());
                  }}
                >
                  TODAY
                </button>
                <div className="flex">
                  <button
                    className="flex h-6 w-6 flex-col items-center justify-center rounded-xl border-2 text-white"
                    onClick={handlePrevWeek}
                  >
                    &lt;
                  </button>
                  {!!dayInfo.length && (
                    <p className="mx-6 w-40 text-white">
                      {parseInt(dayInfo[0]["date"], 10)} {dayInfo[0].month} -{" "}
                      {parseInt(dayInfo[6]["date"], 10)} {dayInfo[6]["month"]}{" "}
                      {dayInfo[6]["year"]}
                    </p>
                  )}
                  <button
                    className="flex h-6 w-6 flex-col items-center justify-center rounded-xl border-2 text-white"
                    onClick={handleNextWeek}
                  >
                    &gt;
                  </button>
                </div>
                <div className="mr-12 flex">
                  <p className="mr-2 text-white">Total</p>
                  <p className="font-extrabold text-white">
                    {view === "week"
                      ? weeklyTotalHours
                      : dailyTotalHours[selectDate]}
                  </p>
                </div>
              </div>
              <DatesInWeek
                dayInfo={dayInfo}
                selectDate={selectDate}
                setSelectDate={setSelectDate}
                view={view}
              />
            </div>
          )}
          {!editEntryId && newEntryView && view !== "week" && (
            <AddEntry
              clients={clients}
              editEntryId={editEntryId}
              entryList={entryList}
              fetchEntries={fetchEntries}
              handleFilterEntry={handleFilterEntry}
              handleRelocateEntry={handleRelocateEntry}
              projects={projects}
              selectedEmployeeId={selectedEmployeeId}
              selectedFullDate={selectedFullDate}
              setEditEntryId={setEditEntryId}
              setNewEntryView={setNewEntryView}
            />
          )}
          {view !== "week" && !newEntryView && (
            <button
              className="h-14 w-full border-2 border-miru-han-purple-600 p-4 text-lg font-bold tracking-widest text-miru-han-purple-600"
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
              className="h-14 w-full border-2 border-miru-han-purple-600 p-4 text-lg font-bold tracking-widest text-miru-han-purple-600"
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
              <AddEntry
                clients={clients}
                editEntryId={editEntryId}
                entryList={entryList}
                fetchEntries={fetchEntries}
                handleFilterEntry={handleFilterEntry}
                handleRelocateEntry={handleRelocateEntry}
                key={entry.id}
                projects={projects}
                selectedEmployeeId={selectedEmployeeId}
                selectedFullDate={selectedFullDate}
                setEditEntryId={setEditEntryId}
                setNewEntryView={setNewEntryView}
              />
            ) : (
              <EntryCard
                currentUserRole={entryList["currentUserRole"]}
                handleDeleteEntry={handleDeleteEntry}
                key={weekCounter}
                setEditEntryId={setEditEntryId}
                {...entry}
              />
            )
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
    </>
  );
};

interface Iprops {
  isAdminUser: boolean;
  user: any;
}

export default TimeTracking;
