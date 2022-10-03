/* eslint-disable no-unexpected-multiline */
import React  from "react";

import { TOASTER_DURATION } from "constants/index";

import * as dayjs from "dayjs";
import * as updateLocale from "dayjs/plugin/updateLocale";
import * as weekday from "dayjs/plugin/weekday";
import { minToHHMM } from "helpers";
import Logger from "js-logger";
import { ToastContainer } from "react-toastify";

import timesheetEntryApi from "apis/timesheet-entry";
import timeTrackingApi from "apis/timeTracking";
import SearchTimeEntries from "common/SearchTimeEntries";
import { sendGAPageView } from "utils/googleAnalytics";

import AddEntry from "./AddEntry";
import DatesInWeek from "./DatesInWeek";
import EntryCard from "./EntryCard";
import MonthCalender from "./MonthCalender";
import WeeklyEntries from "./WeeklyEntries";

const { useState, useEffect } = React;
dayjs.extend(updateLocale);
dayjs.extend(weekday);

const monthsAbbr = "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_");
dayjs.updateLocale("en", { monthShort: monthsAbbr });

// Day start from monday
dayjs.Ls.en.weekStart = 1;

const TimeTracking: React.FC<Iprops> = ({ user, isAdminUser }) => {
  const [dayInfo, setDayInfo] = useState<any[]>([]);
  const [view, setView] = useState<string>("day");
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
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(user?.id);
  const [allEmployeesEntries, setAllEmployeesEntries] = useState<object>({});
  const [clients, setClients] = useState<any>({});
  const [projects, setProjects] = useState<any>({});
  const [employees, setEmployees] = useState<any>([]);

  const employeeOptions = employees.map(e => ({ value: `${e["id"]}`, label: e["first_name"] + " " + e["last_name"] }) );

  useEffect(() => {
    sendGAPageView();
    fetchTimeTrackingData();
  }, []);

  const fetchTimeTrackingData = async () => {
    try {
      const { data } = await timeTrackingApi.get();
      const { clients,
        projects,
        entries,
        employees } = data;

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

    fetchEntries(
      dayjs(dayInfo[0]["fullDate"]).startOf("month").subtract(1, "month").format("DD-MM-YYYY"),
      dayjs(dayInfo[0]["fullDate"]).endOf("month").add(1, "month").format("DD-MM-YYYY"),
    );

    if (allEmployeesEntries[selectedEmployeeId]) setEntryList(allEmployeesEntries[selectedEmployeeId]);
  }, [selectedEmployeeId]);

  const handleWeekTodayButton = () => {
    setSelectDate(0);
    setWeekDay(dayjs().weekday());
  };

  const handleWeekInfo = () => {
    const daysInWeek = Array.from(Array(7).keys()).map((weekCounter) => {
      const [day, month, date, year] = dayjs()
        .weekday(weekCounter + weekDay)
        ["$d"].toString()
        .split(" ");
      const fullDate = dayjs()
        .weekday(weekCounter + weekDay)
        .format("YYYY-MM-DD");
      return {
        day: day,
        month: month,
        date: date,
        year: year,
        fullDate: fullDate
      };
    });
    setDayInfo(() => daysInWeek);
  };

  const fetchEntries = async (from: string, to: string) => {
    const res = await timesheetEntryApi.list(from, to, selectedEmployeeId);
    if (res.status >= 200 && res.status < 300) {
      const ns = { ...allEmployeesEntries };
      ns[selectedEmployeeId] = { ...ns[selectedEmployeeId], ...res.data.entries };
      setAllEmployeesEntries(ns);
      setEntryList(ns[selectedEmployeeId]);
      return true;
    } else {
      return false;
    }
  };

  const handleDeleteEntry = async id => {
    const res = await timesheetEntryApi.destroy(id);
    if (!(res.status === 200)) return;
    const newValue = { ...entryList };
    newValue[selectedFullDate] = newValue[selectedFullDate].filter(e => e.id !== id);
    setAllEmployeesEntries({ ...allEmployeesEntries, [selectedEmployeeId]: newValue });
    setEntryList(newValue);
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
          entries: newRow
        });
      });
    }

    setWeeklyData(() => weekArr);
  };

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <div className="mt-6">
        <div className="flex justify-between items-center mb-6">
          <nav className="flex">
            {["day", "week", "month"].map(item => (
              <button
                onClick={() => setView(item)}
                className={
                  item === view
                    ? "mr-10 tracking-widest font-bold text-miru-han-purple-1000 border-b-2 border-miru-han-purple-1000"
                    : "mr-10 tracking-widest font-medium text-miru-han-purple-600"
                }
              >
                {item.toUpperCase()}
              </button>
            ))}
          </nav>
          {isAdminUser && selectedEmployeeId &&
            <SearchTimeEntries
              selectedEmployeeId={selectedEmployeeId}
              setSelectedEmployeeId={setSelectedEmployeeId}
              employeeList={employeeOptions}
            />
          }
          <div className="w-50"></div>
        </div>

        <div>
          {
            view === "month" ?
              <MonthCalender
                fetchEntries={fetchEntries}
                selectedEmployeeId={selectedEmployeeId}
                dayInfo={dayInfo}
                selectedFullDate={selectedFullDate}
                setSelectedFullDate={setSelectedFullDate}
                entryList={entryList}
                setEntryList={setEntryList}
                handleWeekTodayButton={handleWeekTodayButton}
                monthsAbbr={monthsAbbr}
                setWeekDay={setWeekDay}
                setSelectDate={setSelectDate}
              />
              :
              <div className="mb-6">
                <div className="flex justify-between items-center bg-miru-han-purple-1000 h-10 w-full">
                  <button
                    onClick={() => {
                      setWeekDay(0);
                      setSelectDate(dayjs().weekday());
                    }}
                    className="flex items-center justify-center text-white tracking-widest border-2 rounded h-6 w-20 text-xs font-bold ml-4"
                  >
                  TODAY
                  </button>
                  <div className="flex">
                    <button
                      onClick={handlePrevWeek}
                      className="text-white border-2 h-6 w-6 rounded-xl flex flex-col items-center justify-center"
                    >
                      &lt;
                    </button>
                    {!!dayInfo.length && (
                      <p className="text-white mx-6 w-40">
                        {parseInt(dayInfo[0]["date"],10)} {dayInfo[0].month} -{" "}
                        {parseInt(dayInfo[6]["date"],10)} {dayInfo[6]["month"]}{" "}
                        {dayInfo[6]["year"]}
                      </p>
                    )}
                    <button
                      onClick={handleNextWeek}
                      className="text-white border-2 h-6 w-6 rounded-xl flex flex-col items-center justify-center"
                    >
                      &gt;
                    </button>
                  </div>
                  <div className="flex mr-12">
                    <p className="text-white mr-2">Total</p>
                    <p className="text-white font-extrabold">{ view === "week" ? weeklyTotalHours : dailyTotalHours[selectDate] }</p>
                  </div>
                </div>
                <DatesInWeek
                  view={view}
                  dayInfo={dayInfo}
                  selectDate={selectDate}
                  setSelectDate={setSelectDate}
                />
              </div>
          }
          {!editEntryId && newEntryView && view !== "week" && (
            <AddEntry
              selectedEmployeeId={selectedEmployeeId}
              fetchEntries={fetchEntries}
              setNewEntryView={setNewEntryView}
              clients={clients}
              projects={projects}
              selectedDateInfo={dayInfo[selectDate]}
              selectedFullDate={selectedFullDate}
              setEntryList={setEntryList}
              entryList={entryList}
              setEditEntryId={setEditEntryId}
              editEntryId={editEntryId}
              dayInfo={dayInfo}
            />
          )}
          {view !== "week" && !newEntryView && (
            <button
              onClick={() => {setNewEntryView(true); setEditEntryId(0); }}
              className="h-14 w-full border-2 p-4 border-miru-han-purple-600 text-miru-han-purple-600 font-bold text-lg tracking-widest"
            >
                + NEW ENTRY
            </button>
          )}

          {/* --- weekly view --- */}
          {view === "week" && !newRowView && (
            <button
              onClick={() => setNewRowView(true)}
              className="h-14 w-full border-2 p-4 border-miru-han-purple-600 text-miru-han-purple-600 font-bold text-lg tracking-widest"
            >
                + NEW ROW
            </button>
          )}

          {view === "week" && newRowView && (
            <WeeklyEntries
              key={0}
              entries={[]}
              clients={clients}
              projects={projects}
              newRowView={newRowView}
              entryList={entryList}
              setEntryList={setEntryList}
              setNewRowView={setNewRowView}
              clientName={""}
              projectName={""}
              dayInfo={dayInfo}
              projectId={null}
              isWeeklyEditing={isWeeklyEditing}
              setIsWeeklyEditing={setIsWeeklyEditing}
              weeklyData={weeklyData}
              setWeeklyData={setWeeklyData}
              parseWeeklyViewData={parseWeeklyViewData}
              selectedEmployeeId={selectedEmployeeId}
            />
          )}
        </div>

        {/* entry cards for day and month */}
        {view !== "week" &&
          entryList[selectedFullDate] &&
          entryList[selectedFullDate].map((entry, weekCounter) =>
            editEntryId === entry.id ? (
              <AddEntry
                selectedEmployeeId={selectedEmployeeId}
                fetchEntries={fetchEntries}
                setNewEntryView={setNewEntryView}
                clients={clients}
                projects={projects}
                selectedDateInfo={dayInfo[selectDate]}
                selectedFullDate={selectedFullDate}
                setEntryList={setEntryList}
                entryList={entryList}
                setEditEntryId={setEditEntryId}
                editEntryId={editEntryId}
                dayInfo={dayInfo}
              />
            ) : (
              <EntryCard
                key={weekCounter}
                handleDeleteEntry={handleDeleteEntry}
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
                setEntryList={setEntryList}
                clients={clients}
                projects={projects}
                newRowView={newRowView}
                entryList={entryList}
                setNewRowView={setNewRowView}
                dayInfo={dayInfo}
                isWeeklyEditing={isWeeklyEditing}
                setIsWeeklyEditing={setIsWeeklyEditing}
                parseWeeklyViewData={parseWeeklyViewData}
                selectedEmployeeId={selectedEmployeeId}
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
