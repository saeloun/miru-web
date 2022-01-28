import * as React from "react";
import * as dayjs from "dayjs";
import * as weekday from "dayjs/plugin/weekday";
import AddEntry from "./AddEntry";
import EntryCard from "./EntryCard";
import { getNumberWithOrdinal } from "../helpers/ordinal";

dayjs.extend(weekday);

// Day start from monday
dayjs.Ls.en.weekStart = 1;

interface props {
  clients: client[];
  projects: object;
}

interface client {
  name: string;
  email: string;
}

const TimeTracking: React.FC<props> = ({ clients, projects }) => {
  const { useState, useEffect } = React;
  const [dayInfo, setDayInfo] = useState([]);
  const [view, setView] = useState("day");
  const [newEntryView, setNewEntryView] = useState(false);
  const [selectDate, setSelectDate] = useState(dayjs().weekday());
  const [weekDay, setWeekDay] = useState(0);
  const [totalHours] = useState("00:00");
  const [entryList] = useState([
    {
      id: 1,
      duration: "06:30",
      notes: "Build components",
      client: "Saeloun LLC",
      project: "Miru",
      date: "Mon 20th Jan"
    }
  ]);

  useEffect(() => {
    handleWeekInfo();
  }, [weekDay]);

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
          {newEntryView ? (
            <AddEntry
              setNewEntryView={setNewEntryView}
              clients={clients}
              projects={projects}
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
      {entryList.map(entry => (
        <EntryCard {...entry} />
      ))}
    </main>
  );
};

export default TimeTracking;
