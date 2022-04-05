/* eslint-disable no-unexpected-multiline */
import React from "react";
import { ToastContainer } from "react-toastify";
import * as dayjs from "dayjs";
import * as weekday from "dayjs/plugin/weekday";
import AddEntry from "./AddEntry";
import DatesInWeek from "./DatesInWeek";
import EntryCard from "./EntryCard";
import WeeklyEntries from "./WeeklyEntries";
import { setAuthHeaders, registerIntercepts } from "../../apis/axios";
import timesheetEntryApi from "../../apis/timesheet-entry";
import { minutesToHHMM } from "../../helpers/hhmm-parser";

const { useState, useEffect } = React;
dayjs.extend(weekday);

// Day start from monday
dayjs.Ls.en.weekStart = 1;

const TimeTracking: React.FC<Iprops> = ({
  clients,
  projects,
  entries,
  isAdmin
}) => {
  const [dayInfo, setDayInfo] = useState<any[]>([]);
  const [view, setView] = useState<string>("day");
  const [newEntryView, setNewEntryView] = useState<boolean>(false);
  const [newRowView, setNewRowView] = useState<boolean>(false);
  const [selectDate, setSelectDate] = useState<number>(dayjs().weekday());
  const [weekDay, setWeekDay] = useState<number>(0);
  const [totalHours, setTotalHours] = useState<string>("00:00");
  const [entryList, setEntryList] = useState<object>(entries);
  const [selectedFullDate, setSelectedFullDate] = useState<string>(
    dayjs().format("YYYY-MM-DD")
  );
  const [editEntryId, setEditEntryId] = useState<number>(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [isWeeklyEditing, setIsWeeklyEditing] = useState<boolean>(false);

  // sorting by client's name
  clients.sort((a: object, b: object) => a["name"].localeCompare(b["name"]));

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  useEffect(() => {
    handleWeekInfo();
    fetchEntries();
  }, [weekDay]);

  useEffect(() => {
    calculateTotalHours();
    parseWeeklyViewData();
  }, [weekDay, entryList]);

  useEffect(() => {
    setSelectedFullDate(
      dayjs()
        .weekday(weekDay + selectDate)
        .format("YYYY-MM-DD")
    );
  }, [selectDate, weekDay]);

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

  const fetchEntries = async () => {
    const from = dayjs().weekday(weekDay).format("YYYY-MM-DD");
    const to = dayjs()
      .weekday(weekDay + 6)
      .format("YYYY-MM-DD");
    if (entryList[from]) return;
    const res = await timesheetEntryApi.list(from, to);
    if (res.status >= 200 && res.status < 300) {
      setEntryList(prevState => ({ ...prevState, ...res.data.entries }));
    }
  };

  const handleDeleteEntry = async id => {
    const res = await timesheetEntryApi.destroy(id);
    if (!(res.status === 200)) return;
    setEntryList(pv => {
      const nv = { ...pv };
      nv[selectedFullDate] = nv[selectedFullDate].filter(e => e.id !== id);
      return nv;
    });
  };

  const calculateTotalHours = () => {
    let total = 0;
    for (let weekCounter = 0; weekCounter < 7; weekCounter++) {
      const day = dayjs()
        .weekday(weekCounter + weekDay)
        .format("YYYY-MM-DD");
      if (entryList[day]) {
        entryList[day].forEach(e => {
          total += e.duration;
        });
      }
    }
    setTotalHours(minutesToHHMM(total));
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
    setWeeklyData(weekArr);
  };

  return (
    <>
      <ToastContainer />
      <div className="mx-50 mt-6">
        <div className="flex justify-between">
          <nav className="flex mb-6">
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
          <div>
            {isAdmin && (
              <select className="lg:w-25 lg:h-4 items-center ">
                <option disabled selected className="text-miru-han-purple-1000">
                  Employee
                </option>
              </select>
            )}
          </div>
        </div>

        {/* day and week */}
        {view !== "month" && (
          <div>
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
                    {"<"}
                  </button>
                  {!!dayInfo.length && (
                    <p className="text-white mx-6 w-40">
                      {dayInfo[0]["date"]} {dayInfo[0].month} -{" "}
                      {dayInfo[6]["date"]} {dayInfo[6]["month"]}{" "}
                      {dayInfo[6]["year"]}
                    </p>
                  )}
                  <button
                    onClick={handleNextWeek}
                    className="text-white border-2 h-6 w-6 rounded-xl flex flex-col items-center justify-center"
                  >
                    {">"}
                  </button>
                </div>
                <div className="flex mr-12">
                  <p className="text-white mr-2">Total</p>
                  <p className="text-white font-extrabold">{totalHours}</p>
                </div>
              </div>
              <DatesInWeek view={view} dayInfo={dayInfo} selectDate={selectDate} setSelectDate={setSelectDate}  />
            </div>
            {!editEntryId && newEntryView && view !== "week" && (
              <AddEntry
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
                onClick={() => setNewEntryView(true)}
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
              />
            )}
          </div>
        )}

        {/* entry cards for day and month */}
        {view !== "week" &&
          entryList[selectedFullDate] &&
          entryList[selectedFullDate].map((entry, weekCounter) =>
            editEntryId === entry.id ? (
              <AddEntry
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
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

interface Iprops {
  clients: [];
  projects: object;
  entries: object;
  isAdmin: boolean;
}

export default TimeTracking;
