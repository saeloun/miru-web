/* eslint-disable */

import React, { useRef, useState } from "react";
import CustomDatePicker from "common/CustomDatePicker";
import { useUserContext } from "context/UserContext";
import dayjs from "dayjs";
import { CaretCircleLeftIcon, CaretCircleRightIcon } from "miruIcons";
import LabelText from "./LabelText";
import NavArrowBtn from "./NavArrowBtn";
import { useTimesheetEntries } from "context/TimesheetEntries";

function CalendarNavigator() {
  const {
    view,
    dayInfo = [],
    selectedFullDate = "",
    handleAddEntryDateChange = ({}) => {},
    handleNextDay = () => {},
    handlePreDay = () => {},
    handleNextMonth = () => {},
    handlePrevMonth = () => {},
    handleNextWeek = () => {},
    handlePrevWeek = () => {},
  } = useTimesheetEntries();
  const [openOsCalendar, setOpenOsCalendar] = useState<boolean>(false);

  const { isDesktop } = useUserContext();
  const datePickerRef = useRef(null);

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

  if (!dayInfo.length) {
    return null;
  }

  return (
    <div className="relative flex">
      <NavArrowBtn
        id="prevMonth"
        handleClick={getLeftArrowAction}
        icon={<CaretCircleLeftIcon size={20} />}
      />
      <label
        className="mx-3 text-center text-sm font-medium leading-5"
        htmlFor="Os_calendar"
        onClick={() => {
          !isDesktop && setOpenOsCalendar(!openOsCalendar);
        }}
      >
        <LabelText />
      </label>
      <div className="absolute right-50 top-8" ref={datePickerRef}>
        {openOsCalendar && (
          <CustomDatePicker
            visibility={openOsCalendar}
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
      <NavArrowBtn
        id="nextMonth"
        handleClick={getRightArrowAction}
        icon={<CaretCircleRightIcon size={20} />}
      />
    </div>
  );
}

export default CalendarNavigator;
