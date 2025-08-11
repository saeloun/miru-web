/* eslint-disable */

import React, { useRef, useState } from "react";
import CustomDatePicker from "common/CustomDatePicker";
import { useUserContext } from "context/UserContext";
import dayjs from "dayjs";
import LabelText from "./LabelText";
import NavArrowBtn, { NavArrowBtnDirections } from "./NavArrowBtn";
import { useTimesheetEntries } from "context/TimesheetEntries";

function CalendarNavigator() {
  const {
    view,
    dayInfo = [],
    selectedFullDate = "",
    handleAddEntryDateChange = ({}) => {},
    handleNextDay = () => {
      /* Default empty handler */
    },
    handlePreDay = () => {
      /* Default empty handler */
    },
    handleNextMonth = () => {
      /* Default empty handler */
    },
    handlePrevMonth = () => {
      /* Default empty handler */
    },
    handleNextWeek = () => {
      /* Default empty handler */
    },
    handlePrevWeek = () => {
      /* Default empty handler */
    },
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
        iconSize={20}
        handleClick={getLeftArrowAction}
        direction={NavArrowBtnDirections.prev}
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
        iconSize={20}
        handleClick={getRightArrowAction}
        direction={NavArrowBtnDirections.next}
      />
    </div>
  );
}

export default CalendarNavigator;
