/* eslint-disable */
import React from "react";
import dayjs from "dayjs";
import { minToHHMM } from "helpers";
import CalendarNavigator from "./CalendarNavigator";
import { useTimesheetEntries } from "context/TimesheetEntries";

const Header = () => {
  const {
    view,
    selectDate,
    setWeekDay,
    setSelectDate,
    dailyTotalHours,
    weeklyTotalHours,
    handleMonthTodayButton,
    totalMonthDuration,
  } = useTimesheetEntries();

  const getTodayAction = () => {
    if (view === "month") {
      handleMonthTodayButton();
    } else {
      setWeekDay(0);
      setSelectDate(dayjs().weekday());
    }
  };

  const getTotal = () => {
    if (view === "month") {
      return minToHHMM(totalMonthDuration);
    }
    if (view === "day") {
      return dailyTotalHours[selectDate];
    }
    if (view === "week") {
      return weeklyTotalHours;
    }
  };

  return (
    <div className="flex w-full items-center justify-between bg-miru-han-purple-1000 px-3 py-3 text-white lg:h-10 lg:p-2">
      <button
        className="items-center justify-center rounded border px-6 py-1 text-center text-xs font-bold leading-4"
        onClick={getTodayAction}
      >
        TODAY
      </button>
      <CalendarNavigator />
      <div className="flex items-center lg:pr-8">
        <p className="mr-2 text-xs font-normal leading-4">Total</p>
        <p className="text-right text-base font-extrabold leading-5">
          {getTotal()}
        </p>
      </div>
    </div>
  );
};

export default Header;
