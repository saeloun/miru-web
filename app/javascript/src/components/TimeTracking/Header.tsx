/* eslint-disable */
import React, { useState, useRef } from "react";
import dayjs from "dayjs";

import { minToHHMM } from "helpers";
import { CaretCircleLeftIcon, CaretCircleRightIcon } from "miruIcons";
import { useUserContext } from "context/UserContext";
import CustomDatePicker from "common/CustomDatePicker";

const Header = ({
  setWeekDay = ({}) => {},
  setSelectDate = ({}) => {},
  handlePreDay = () => {
    /* Default empty handler */
  },
  dayInfo = [],
  selectDate = 0,
  handleNextDay = () => {
    /* Default empty handler */
  },
  handleAddEntryDateChange = ({}) => {},
  selectedFullDate = "",
  dailyTotalHours = [],
  view = "",
  totalMonthDuration = 0,
  weeklyTotalHours = "",
  handleNextMonth = () => {
    /* Default empty handler */
  },
  handlePrevMonth = () => {
    /* Default empty handler */
  },
  handleMonthTodayButton = () => {
    /* Default empty handler */
  },
  handleNextWeek = () => {
    /* Default empty handler */
  },
  handlePrevWeek = () => {
    /* Default empty handler */
  },
  monthsAbbr = [],
  currentMonthNumber = 0,
  currentYear = 0,
}) => {
  const [openOsCalendar, setOpenOsCalendar] = useState(false);

  const datePickerRef = useRef(null);
  const { isDesktop } = useUserContext();

  const getTodayAction = () => {
    if (view === "month") {
      handleMonthTodayButton();
    } else {
      setWeekDay(0);
      setSelectDate(dayjs().weekday());
    }
  };

  const getRightArrowAction = () => {
    if (view === "month") {
      handleNextMonth();
    }
    if (view === "day") {
      isDesktop ? handleNextWeek() : handleNextDay();
    }
    if (view === "week") {
      handleNextWeek();
    }
  };

  const getLeftArrowAction = () => {
    if (view === "month") {
      handlePrevMonth();
    }
    if (view === "day") {
      isDesktop ? handlePrevWeek() : handlePreDay();
    }
    if (view === "week") {
      handlePrevWeek();
    }
  };

  const getLabel = () => {
    if (view === "month") {
      return (
        <>
          <span className="mr-2">
            {monthsAbbr[Math.abs(currentMonthNumber)]}
          </span>
          <span>{currentYear}</span>
        </>
      );
    }
    if (view === "day") {
      return isDesktop ? (
        <>
          <span>
            {parseInt(dayInfo[0]["date"], 10)} {dayInfo[0]["month"]} -
          </span>
          <span className="mx-1">
            {parseInt(dayInfo[6]["date"], 10)} {dayInfo[6]["month"]}
          </span>
          <span> {dayInfo[6]["year"]}</span>
        </>
      ) : (
        <>
          <span>{parseInt(dayInfo[selectDate]["date"], 10)}</span>
          <span className="mx-1">{dayInfo[selectDate].month}</span>
          <span>{dayInfo[selectDate]["year"]}</span>
        </>
      );
    }
    if (view === "week") {
      return (
        <>
          <span>
            {parseInt(dayInfo[0]["date"], 10)} {dayInfo[0]["month"]} -
          </span>
          <span className="mx-1">
            {parseInt(dayInfo[6]["date"], 10)} {dayInfo[6]["month"]}
          </span>
          <span> {dayInfo[6]["year"]}</span>
        </>
      );
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
      <div className="relative flex">
        <button
          className="flex flex-col items-center justify-center"
          onClick={getLeftArrowAction}
          id="prevMonth"
        >
          <CaretCircleLeftIcon size={20} />
        </button>
        {!!dayInfo.length && (
          <>
            <label
              className="mx-3 text-center text-sm font-medium leading-5"
              htmlFor="Os_calendar"
              onClick={() => {
                !isDesktop && setOpenOsCalendar(!openOsCalendar);
              }}
            >
              {getLabel()}
            </label>
            <div className="absolute right-50 top-8" ref={datePickerRef}>
              {openOsCalendar && (
                <CustomDatePicker
                  date={dayjs(selectedFullDate).toDate()}
                  setVisibility={setOpenOsCalendar}
                  wrapperRef={datePickerRef}
                  handleChange={date => {
                    setOpenOsCalendar(false);
                    handleAddEntryDateChange(date);
                  }}
                />
              )}
            </div>
          </>
        )}
        <button
          className="flex flex-col items-center justify-center"
          onClick={getRightArrowAction}
          id="nextMonth"
        >
          <CaretCircleRightIcon size={20} />
        </button>
      </div>
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
