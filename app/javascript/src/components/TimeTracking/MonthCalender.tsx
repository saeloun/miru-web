/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";

import dayjs from "dayjs";
import { minToHHMM } from "helpers";
import Logger from "js-logger";

// Day start from monday
dayjs.Ls.en.weekStart = 1;

const MonthCalender = ({
  fetchEntries,
  selectedEmployeeId,
  dayInfo,
  entryList,
  selectedFullDate,
  setSelectedFullDate,
  handleWeekTodayButton,
  monthsAbbr,
  setWeekDay,
  setSelectDate,
  currentMonthNumber,
  setCurrentMonthNumber,
  currentYear,
  setCurrentYear,
}: Iprops) => {
  const [firstDay, setFirstDay] = useState<number>(
    dayjs().startOf("month").weekday()
  );
  const [daysInMonth, setDaysInMonth] = useState<number>(dayjs().daysInMonth());
  const [totalMonthDuration, setTotalMonthDuration] = useState<number>(0);
  const [monthData, setMonthData] = useState<object[]>([]);
  const [startOfTheMonth, setStartOfTheMonth] = useState<string>(
    dayjs().startOf("month").format("YYYY-MM-DD")
  );

  const [endOfTheMonth, setEndOfTheMonth] = useState<string>(
    dayjs().endOf("month").format("YYYY-MM-DD")
  );
  const today = dayjs().format("YYYY-MM-DD");

  const handleMonthChange = () => {
    const monthData = [];
    let weeksData = [];
    let currentWeekTotalHours = 0;
    let dayInWeekCounter = firstDay;
    for (let i = 1; i <= daysInMonth; i++) {
      // Ex. date = "2020-01-01"
      const date = dayjs(
        `${currentYear}-${currentMonthNumber + 1}-${i}`
      ).format("YYYY-MM-DD");

      const totalDuration = entryList[date]?.reduce(
        (acc: number, cv: number) => cv["duration"] + acc,
        0
      );
      if (totalDuration) currentWeekTotalHours += totalDuration;
      weeksData[dayInWeekCounter] = {
        date,
        day: i,
        totalDuration,
      };
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

    setTotalMonthDuration(
      monthData.reduce((acc: number, cv: any[]) => cv[7] + acc, 0)
    );
    setMonthData(monthData);
  };

  const handlePrevMonth = async () => {
    try {
      const startOfTheMonth2MonthsAgo = dayjs(startOfTheMonth)
        .subtract(2, "month")
        .format("YYYY-MM-DD");

      const endOfTheMonth2MonthsAgo = dayjs(endOfTheMonth)
        .subtract(2, "month")
        .format("YYYY-MM-DD");
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
      const startOfTheMonth2MonthsLater = dayjs(startOfTheMonth)
        .add(2, "month")
        .format("YYYY-MM-DD");

      const endOfTheMonth2MonthsLater = dayjs(endOfTheMonth)
        .add(2, "month")
        .format("YYYY-MM-DD");

      await fetchEntries(
        startOfTheMonth2MonthsLater,
        endOfTheMonth2MonthsLater
      );
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
    const firstDateOfTheMonth = `${currentYear}-${currentMonthNumber + 1}-01`;
    setStartOfTheMonth(dayjs(firstDateOfTheMonth).format("YYYY-MM-DD"));
    setEndOfTheMonth(
      dayjs(firstDateOfTheMonth).endOf("month").format("YYYY-MM-DD")
    );
    setDaysInMonth(dayjs(firstDateOfTheMonth).daysInMonth());
    setFirstDay(() => dayjs(firstDateOfTheMonth).startOf("month").weekday());
  };

  const handleWeekday = (date: string) => {
    const firstDateOfCurrentWeek = dayjs(today)
      .startOf("week")
      .format("YYYY-MM-DD");

    const firstDateOfSelectedWeek = dayjs(date)
      .startOf("week")
      .format("YYYY-MM-DD");

    setWeekDay(
      dayjs(firstDateOfCurrentWeek).diff(firstDateOfSelectedWeek, "week") * -7
    );
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

  return (
    <div className="mb-6">
      <div className="flex h-10 w-full items-center justify-between bg-miru-han-purple-1000">
        <button
          className="ml-4 flex h-6 w-20 items-center justify-center rounded border-2 text-xs font-bold tracking-widest text-white"
          onClick={handleMonthTodayButton}
        >
          TODAY
        </button>
        <div className="flex">
          <button
            className="flex h-6 w-6 flex-col items-center justify-center rounded-xl border-2 text-white"
            onClick={handlePrevMonth}
          >
            &lt;
          </button>
          <p className="mx-6 w-auto text-white">
            {monthsAbbr[Math.abs(currentMonthNumber)]} {currentYear}
          </p>
          <button
            className="flex h-6 w-6 flex-col items-center justify-center rounded-xl border-2 text-white"
            onClick={handleNextMonth}
          >
            &gt;
          </button>
        </div>
        <div className="mr-12 flex">
          <p className="mr-2 text-white">Total</p>
          <p className="font-extrabold text-white">
            {minToHHMM(totalMonthDuration)}
          </p>
        </div>
      </div>
      <div className="bg-miru-gray-100 p-4">
        <div className="mb-4 flex justify-between bg-miru-gray-100">
          {dayInfo.map((d, index) => (
            <div
              className="w-28 items-center rounded-xl text-center text-xs font-medium text-miru-dark-purple-1000"
              key={index}
            >
              {d.day}
            </div>
          ))}
          <div className="w-28 items-center rounded-xl text-center text-xs font-medium text-miru-dark-purple-1000">
            Total
          </div>
        </div>
        {monthData.map((weekInfo, index) => (
          <div
            className="my-4 flex justify-between bg-miru-gray-100"
            key={index}
          >
            {Array.from(Array(7).keys()).map(dayNum =>
              weekInfo[dayNum] ? (
                <div
                  key={dayNum}
                  className={`flex h-14 w-24 cursor-pointer justify-end rounded-md border-2 bg-white p-1
                    ${
                      weekInfo[dayNum]["date"] === selectedFullDate
                        ? "border-miru-han-purple-1000"
                        : "border-transparent"
                    }`}
                  onClick={() => {
                    handleWeekday(weekInfo[dayNum].date);
                    setSelectDate(dayNum);
                  }}
                >
                  <div>
                    <div className="flex justify-end">
                      <p
                        className={`text-xs font-medium ${
                          weekInfo[dayNum]["date"] === today
                            ? "rounded-xl bg-miru-han-purple-1000 px-2 text-miru-white-1000"
                            : "text-miru-dark-purple-200"
                        }`}
                      >
                        {weekInfo[dayNum]["day"]}
                      </p>
                    </div>
                    <p className="mx-3 text-2xl text-miru-dark-purple-1000">
                      {weekInfo[dayNum]["totalDuration"] > 0
                        ? minToHHMM(weekInfo[dayNum]["totalDuration"])
                        : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="h-14 w-24 text-miru-dark-purple-1000"
                  key={dayNum}
                />
              )
            )}
            <div className="relative h-14 w-24 rounded-md bg-white font-bold">
              <div className="absolute bottom-0 right-0 flex justify-end p-1">
                <p className="mr-auto text-2xl">
                  {weekInfo[7] ? minToHHMM(weekInfo[7]) : ""}
                </p>
              </div>
            </div>
          </div>
        ))}
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
  handleWeekTodayButton: () => void;
  monthsAbbr: string[];
  setWeekDay: React.Dispatch<React.SetStateAction<number>>;
  setSelectDate: React.Dispatch<React.SetStateAction<number>>;
  currentMonthNumber: any;
  setCurrentMonthNumber: any;
  currentYear: any;
  setCurrentYear: any;
}

export default MonthCalender;
