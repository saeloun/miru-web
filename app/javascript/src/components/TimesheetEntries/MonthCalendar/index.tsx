import React, { useState, useEffect } from "react";

import { useTimesheetEntries } from "context/TimesheetEntries";
import dayjs from "dayjs";
import { minToHHMM } from "helpers";

import CalendarCell from "./CalendarCell";
import InvalidEmptyCalendarCell from "./InvalidEmptyCalendarCell";

// Day start from monday
dayjs.Ls.en.weekStart = 1;

const MonthCalender = () => {
  const {
    monthData,
    entryList,
    selectedFullDate,
    setWeekDay,
    setSelectDate,
    currentMonthNumber,
    currentYear,
    setStartOfTheMonth,
    setEndOfTheMonth,
    setFirstDay,
    handleMonthChange,
  } = useTimesheetEntries();

  const [daysInMonth, setDaysInMonth] = useState<number>(dayjs().daysInMonth());
  const today = dayjs().format("YYYY-MM-DD");
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
    if (entryList) {
      handleMonthChange();
    }
  }, [entryList]);

  return (
    <div className="mb-6">
      <div className="bg-miru-gray-100 p-4">
        <div className="mb-4 flex justify-between bg-miru-gray-100">
          {DAYS.map(day => (
            <div
              className="w-28 items-center rounded-xl text-center text-xs font-medium text-miru-dark-purple-1000"
              key={day}
            >
              {day}
            </div>
          ))}
          <div className="w-28 items-center rounded-xl text-center text-xs font-medium text-miru-dark-purple-1000">
            Total
          </div>
        </div>
        {monthData?.length > 0
          ? monthData.map((weekInfo, index) => (
              <div
                className="my-4 flex justify-between bg-miru-gray-100"
                key={`months-${index}`}
              >
                {DAYS.map((_day, dayNum) =>
                  weekInfo[dayNum] ? (
                    <CalendarCell
                      dayNum={dayNum}
                      handleWeekday={handleWeekday}
                      key={`cell-${dayNum}`}
                      weekInfo={weekInfo}
                    />
                  ) : (
                    <InvalidEmptyCalendarCell key={`invalid-cell-${dayNum}`} />
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
            ))
          : null}
      </div>
    </div>
  );
};
export default MonthCalender;
