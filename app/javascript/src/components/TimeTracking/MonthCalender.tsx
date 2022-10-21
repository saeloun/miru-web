/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";

import dayjs from "dayjs";
import { minToHHMM } from "helpers";
import Logger from "js-logger";

const { useState, useEffect } = React;
// Day start from monday
dayjs.Ls.en.weekStart = 1;

const MonthCalender: React.FC<Iprops> = ({ fetchEntries, selectedEmployeeId, dayInfo, entryList, selectedFullDate, setSelectedFullDate, handleWeekTodayButton, monthsAbbr, setWeekDay, setSelectDate  }) => {
  const [currentMonthNumber, setCurrentMonthNumber] = useState<number>(dayjs().month());
  const [currentYear, setCurrentYear] = useState<number>(dayjs().year());
  const [firstDay, setFirstDay] = useState<number>(dayjs().startOf("month").weekday());
  const [daysInMonth, setDaysInMonth] = useState<number>(dayjs().daysInMonth());
  const [totalMonthDuration, setTotalMonthDuration] = useState<number>(0);
  const [monthData, setMonthData] = useState<object[]>([]);
  const [startOfTheMonth, setStartOfTheMonth] = useState<string>(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [endOfTheMonth, setEndOfTheMonth] = useState<string>(dayjs().endOf("month").format("YYYY-MM-DD"));
  const today = dayjs().format("YYYY-MM-DD");

  const handleMonthChange = () => {
    const monthData = [];
    let weeksData = [];
    let currentWeekTotalHours = 0;
    let dayInWeekCounter = firstDay;
    for (let i = 1; i <= daysInMonth; i++) {
      // Ex. date = "2020-01-01"
      const date = dayjs(`${currentYear}-${currentMonthNumber + 1}-${i}`).format("YYYY-MM-DD");
      const totalDuration = entryList[date]?.reduce((acc: number, cv: number) => cv["duration"] + acc, 0);
      if (totalDuration) currentWeekTotalHours += totalDuration;
      weeksData[dayInWeekCounter] = { date: date, day: i, totalDuration: totalDuration };
      // if the day is sunday, create a new week
      if (dayInWeekCounter === 6) {
        weeksData[7] = currentWeekTotalHours;
        currentWeekTotalHours = 0;
        monthData.push(weeksData);
        weeksData = [];
        dayInWeekCounter = 0;
      } else {
        dayInWeekCounter++;
      }
    }
    if (weeksData.length) {
      weeksData[7] = currentWeekTotalHours;
      monthData.push(weeksData);
    }
    setTotalMonthDuration(monthData.reduce((acc: number, cv: any[]) => cv[7] + acc, 0));
    setMonthData(monthData);
  };

  const handlePrevMonth = async () => {
    try {
      const startOfTheMonth2MonthsAgo = dayjs(startOfTheMonth).subtract(2, "month").format("YYYY-MM-DD");
      const endOfTheMonth2MonthsAgo = dayjs(endOfTheMonth).subtract(2, "month").format("YYYY-MM-DD");
      await fetchEntries(startOfTheMonth2MonthsAgo, endOfTheMonth2MonthsAgo);
      if (currentMonthNumber === 0) {
        setCurrentMonthNumber(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonthNumber(cmn => cmn - 1);
      }
    } catch (error) {
      Logger.error(error);
    }
  };

  const handleNextMonth = async () => {
    try {
      const startOfTheMonth2MonthsLater = dayjs(startOfTheMonth).add(2, "month").format("YYYY-MM-DD");
      const endOfTheMonth2MonthsLater = dayjs(endOfTheMonth).add(2, "month").format("YYYY-MM-DD");
      await fetchEntries(startOfTheMonth2MonthsLater, endOfTheMonth2MonthsLater);
      if (currentMonthNumber === 11) {
        setCurrentMonthNumber(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonthNumber(currentMonthNumber + 1);
      }
    } catch (error) {
      Logger.error(error);
    }
  };

  const handleMonthTodayButton = () => {
    handleWeekTodayButton();
    setCurrentMonthNumber(dayjs().month());
    setFirstDay(() => dayjs().startOf("month").weekday());
    setCurrentYear(dayjs().year());
  };

  const handleMonthNumberChange = () => {
    const firstDateOfTheMonth = `${currentYear}-${currentMonthNumber +1}-01`;
    setStartOfTheMonth(dayjs(firstDateOfTheMonth).format("YYYY-MM-DD"));
    setEndOfTheMonth(dayjs(firstDateOfTheMonth).endOf("month").format("YYYY-MM-DD"));
    setDaysInMonth(dayjs(firstDateOfTheMonth).daysInMonth());
    setFirstDay(() => dayjs(firstDateOfTheMonth).startOf("month").weekday());
  };

  const handleWeekday = (date: string) => {
    const firstDateOfCurrentWeek = dayjs(today).startOf("week").format("YYYY-MM-DD");
    const firstDateOfSelectedWeek = dayjs(date).startOf("week").format("YYYY-MM-DD");
    setWeekDay(dayjs(firstDateOfCurrentWeek).diff(firstDateOfSelectedWeek, "week") * -7);
  };

  useEffect(() => {
    handleMonthNumberChange();
  }, [currentMonthNumber]);

  useEffect(() => {
    handleMonthChange();
  }, [firstDay]);

  useEffect(() => {
    handleMonthChange();
  }, [entryList]);

  useEffect(() => {
    fetchEntries(
      dayjs(startOfTheMonth).subtract(1, "month").format("DD-MM-YYYY"),
      dayjs(endOfTheMonth).add(1, "month").format("DD-MM-YYYY")
    );
  }, [selectedEmployeeId]);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center bg-miru-han-purple-1000 h-10 w-full">
        <button
          onClick={handleMonthTodayButton}
          className="flex items-center justify-center text-white tracking-widest border-2 rounded h-6 w-20 text-xs font-bold ml-4"
        >
          TODAY
        </button>
        {
          <div className="flex">
            <button
              onClick={handlePrevMonth}
              className="text-white border-2 h-6 w-6 rounded-xl flex flex-col items-center justify-center"
            >
              &lt;
            </button>
            <p className="text-white mx-6 w-auto">
              {monthsAbbr[Math.abs(currentMonthNumber)]} {currentYear}
            </p>
            <button
              onClick={handleNextMonth}
              className="text-white border-2 h-6 w-6 rounded-xl flex flex-col items-center justify-center"
            >
              &gt;
            </button>
          </div>
        }
        <div className="flex mr-12">
          <p className="text-white mr-2">Total</p>
          <p className="text-white font-extrabold">{minToHHMM(totalMonthDuration)}</p>
        </div>
      </div>
      <div className='p-4 bg-miru-gray-100'>
        <div className="bg-miru-gray-100 flex justify-between mb-4">
          {dayInfo.map((d, index) => (
            <div
              key={index}
              className="text-center text-xs text-miru-dark-purple-1000 font-medium w-28 items-center rounded-xl"
            >
              {d.day}
            </div>
          ))}
          <div
            key="8"
            className="text-center text-xs text-miru-dark-purple-1000 font-medium w-28 items-center rounded-xl"
          >
          Total
          </div>
        </div>
        {
          monthData.map((weekInfo) => (
            <div className="my-4 bg-miru-gray-100 flex justify-between">
              {Array.from(Array(7).keys()).map((dayNum) => (
                weekInfo[dayNum] ? <div onClick={() => {
                  handleWeekday(weekInfo[dayNum].date);
                  setSelectDate(dayNum);
                }} className={("border-2 cursor-pointer h-14 w-24 bg-white rounded-md flex justify-end p-1 " + (weekInfo[dayNum]["date"] === selectedFullDate ? "border-miru-han-purple-1000" : "border-transparent"))}>
                  <div>
                    <div className="flex justify-end">
                      <p className={"text-xs font-medium " + (weekInfo[dayNum]["date"] === today ? "text-miru-white-1000 bg-miru-han-purple-1000 rounded-xl px-2" : "text-miru-dark-purple-200")}>{weekInfo[dayNum]["day"]}</p>
                    </div>
                    <p className="text-2xl mx-3 text-miru-dark-purple-1000">{weekInfo[dayNum]["totalDuration"] > 0 ? minToHHMM(weekInfo[dayNum]["totalDuration"]) : ""}</p>
                  </div>
                </div>
                  :
                  <div className="h-14 w-24 text-miru-dark-purple-1000"></div>
              ))}
              <div className="h-14 w-24 bg-white rounded-md font-bold relative">
                <div className="flex p-1 justify-end bottom-0 right-0 absolute">
                  <p className="text-2xl mr-auto">{weekInfo[7] ? minToHHMM(weekInfo[7]) : ""}</p>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};

interface Iprops {
  fetchEntries: (from: string, to: string) => void;
  selectedEmployeeId: number;
  dayInfo: any[];
  selectedFullDate: string;
  setSelectedFullDate: any;
  entryList: object;
  setEntryList: object
  handleWeekTodayButton: () => void;
  monthsAbbr: string[];
  setWeekDay: React.Dispatch<React.SetStateAction<number>>;
  setSelectDate: React.Dispatch<React.SetStateAction<number>>;
}

export default MonthCalender;
