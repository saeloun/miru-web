/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useEffect } from "react";

import dayjs from "dayjs";
import { minToHHMM } from "helpers";
import Logger from "js-logger";

import Header from "./Header";

// Day start from monday
dayjs.Ls.en.weekStart = 1;

const MonthCalender = ({
  fetchEntries,
  selectedEmployeeId,
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
  dayInfo,
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
    const firstDateOfTheMonth = `${currentYear}-${currentMonthNumber + 1}-01`;
    const daysInCurrentMonth = dayjs(firstDateOfTheMonth).daysInMonth();
    let dayInWeekCounter = dayjs(firstDateOfTheMonth)
      .startOf("month")
      .weekday();

    for (let i = 1; i <= daysInCurrentMonth; i++) {
      // Ex. date = "2020-01-01"
      const date = dayjs(
        `${currentYear}-${currentMonthNumber + 1}-${i}`
      ).format("YYYY-MM-DD");

      const totalDuration =
        entryList && entryList[date]
          ? entryList[date]?.reduce(
              (acc: number, cv: number) => cv["duration"] + acc,
              0
            )
          : 0;
      if (totalDuration) currentWeekTotalHours += totalDuration;
      weeksData[dayInWeekCounter] = {
        date,
        day: i,
        totalDuration,
      };
      // if the day is sunday, create a new week
      if (dayInWeekCounter === 6) {
        if (weeksData[6].date < today) {
          weeksData[7] = currentWeekTotalHours;
        } else weeksData[7] = currentWeekTotalHours || null;
        currentWeekTotalHours = 0;
        monthData.push(weeksData);
        weeksData = [];
        dayInWeekCounter = 0;
      } else {
        dayInWeekCounter++;
      }
    }
    if (weeksData.length) {
      if (weeksData[weeksData.length - 1].date < today) {
        weeksData[7] = currentWeekTotalHours;
      } else weeksData[7] = currentWeekTotalHours || null;
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
    handleMonthChange();
  }, [currentMonthNumber, currentYear]);

  useEffect(() => {
    handleMonthChange();
  }, [entryList]);

  return (
    <div className="mb-6">
      <Header
        currentMonthNumber={currentMonthNumber}
        currentYear={currentYear}
        dayInfo={dayInfo}
        handleMonthTodayButton={handleMonthTodayButton}
        handleNextMonth={handleNextMonth}
        handlePrevMonth={handlePrevMonth}
        monthsAbbr={monthsAbbr}
        totalMonthDuration={totalMonthDuration}
        view="month"
      />
      <div className="bg-miru-gray-100 p-4">
        <div className="mb-4 flex justify-between bg-miru-gray-100">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, index) => (
            <div
              className="w-28 items-center rounded-xl text-center text-xs font-medium text-miru-dark-purple-1000"
              key={index}
            >
              {d}
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
                  className={`flex h-14 w-16 cursor-pointer justify-end rounded-md border-2 bg-white p-1 xl:w-24
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
                    <p className="mx-auto text-xl text-miru-dark-purple-1000 xl:mx-3 xl:text-2xl">
                      {(() => {
                        if (weekInfo[dayNum]["totalDuration"] > 0) {
                          return minToHHMM(weekInfo[dayNum]["totalDuration"]);
                        } else if (weekInfo[dayNum]["date"] < today) {
                          return "00:00";
                        }

                        return "";
                      })()}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="h-14 w-16 text-miru-dark-purple-1000 xl:w-24"
                  key={dayNum}
                />
              )
            )}
            <div className="relative h-14 w-16 rounded-md bg-white font-semibold xl:w-24 xl:font-bold">
              <div className="absolute bottom-0 right-0 flex justify-end p-1">
                <p className="mr-auto text-xl xl:text-2xl" id={weekInfo[7]}>
                  {(() => {
                    if (weekInfo[7]) {
                      return minToHHMM(weekInfo[7]);
                    } else if (weekInfo[7] === 0) {
                      return "00:00";
                    }
                  })()}
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
  dayInfo: any[];
}

export default MonthCalender;
