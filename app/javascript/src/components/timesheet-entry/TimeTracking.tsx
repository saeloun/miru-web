import * as React from "react";
import * as dayjs from "dayjs";
import * as weekday from "dayjs/plugin/weekday";
import AddEntry from "./AddEntry";
import EntryCard from "./EntryCard";
import timesheetEntryApi from "../../apis/timesheet-entry";
import { getNumberWithOrdinal } from "../../helpers/ordinal";

dayjs.extend(weekday);

// Day start from monday
dayjs.Ls.en.weekStart = 1;

interface props {
  clients: client[];
  projects: object;
  entries: object;
}

interface client {
  name: string;
  email: string;
}

const TimeTracking: React.FC<props> = ({ clients, projects, entries }) => {
  const { useState, useEffect } = React;
  const [dayInfo, setDayInfo] = useState([]);
  const [view, setView] = useState("day");
  const [newEntryView, setNewEntryView] = useState(false);
  const [selectDate, setSelectDate] = useState(dayjs().weekday());
  const [weekDay, setWeekDay] = useState(0);
  const [totalHours, setTotalHours] = useState("00:00");
  const [entryList, setEntryList] = useState(entries);
  const [selectedFullDate, setSelectedFullDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [editEntryId, setEditEntryId] = useState(0);

  useEffect(() => {
    handleWeekInfo();
    fetchEntries();
  }, [weekDay]);

  useEffect(() => {
    setSelectedFullDate(
      dayjs()
        .weekday(weekDay + selectDate)
        .format("YYYY-MM-DD")
    );
  }, [selectDate, weekDay]);

  const handleWeekInfo = () => {
    const weekArr = [];
    for (let i = 0; i < 7; i++) {
      const [day, month, date, year] = dayjs()
        .weekday(i + weekDay)
        ["$d"].toString()
        .split(" ");
      weekArr.push({ day: day, month: month, date: date, year: year });
    }
    setDayInfo(weekArr);
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
    if (!res.data.success) return;
    setEntryList(pv => {
      const nv = { ...pv };
      nv[selectedFullDate] = nv[selectedFullDate].filter(e => e.id !== id);
      return nv;
    });
  };

  const handleNextWeek = () => {
    setWeekDay(p => p + 7);
  };

  const handlePrevWeek = () => {
    setWeekDay(p => p - 7);
  };

  return (
    <main className="mx-50">
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
        <select className="lg:w-25 lg:h-4 items-center">
          <option className="text-miru-han-purple-1000" value="Jon Smith">
            Jon Smith
          </option>
        </select>
      </div>
      {view === "day" ? (
        <div>
          <div className="mb-6">
            <div className="flex justify-between items-center bg-miru-han-purple-1000 h-10 w-full">
              <button className="items-center text-white tracking-widest border-2 rounded-lg h-6 w-20 text-base ml-4">
                <button
                  onClick={() => {
                    setWeekDay(0);
                    setSelectDate(dayjs().weekday());
                  }}
                  className="text-center"
                >
                  TODAY
                </button>
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
            <div className="h-16 bg-miru-gray-100 flex justify-evenly">
              {dayInfo.map((d, index) => (
                <button
                  onClick={() => {
                    setSelectDate(index);
                  }}
                  key={index}
                  className={
                    "px-5 py-2 my-2 w-24 h-12 items-center rounded-xl border-2 border-transparent " +
                    (index === selectDate
                      ? "bg-white border-miru-han-purple-1000"
                      : "")
                  }
                >
                  <p className="text-xs text-miru-dark-purple-1000 font-extrabold">
                    {d.day}
                  </p>
                  <p className="text-xs">
                    {getNumberWithOrdinal(d.date)} {d.month}{" "}
                  </p>
                </button>
              ))}
            </div>
          </div>
          {editEntryId ? (
            ""
          ) : newEntryView ? (
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
            />
          ) : (
            <button
              onClick={() => setNewEntryView(true)}
              className="h-14 w-full border-2 p-4 border-miru-han-purple-600 text-miru-han-purple-600 font-bold text-lg tracking-widest"
            >
              + NEW ENTRY
            </button>
          )}
        </div>
      ) : view === "week" ? (
        <div></div>
      ) : (
        <div></div>
      )}
      {entryList[selectedFullDate] &&
        entryList[selectedFullDate].map((entry, i) =>
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
            />
          ) : (
            <EntryCard
              key={i}
              handleDeleteEntry={handleDeleteEntry}
              setEditEntryId={setEditEntryId}
              {...entry}
            />
          )
        )}
    </main>
  );
};

export default TimeTracking;
