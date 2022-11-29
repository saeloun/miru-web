/* eslint-disable no-unused-vars */
import React, { useEffect, useRef } from "react";

import { getMonth, getYear } from "date-fns";
import dayjs from "dayjs";
import {
  CaretCircleLeftIcon,
  CaretCircleRightIcon,
  LeftArrowIcon,
} from "miruIcons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const CustomDateRangePicker = ({
  hideCustomFilter,
  handleSelectDate,
  onClickInput,
  selectedInput,
  dateRange,
}) => {
  const fromInput = "from-input";
  const toInput = "to-input";

  const range = (start, end) =>
    Array.from({ length: end - start }, (v, k) => k + start);

  const years = range(1990, getYear(new Date()) + 1);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const textInput = useRef(null);
  useEffect(() => {
    textInput.current.focus();
  }, []);

  return (
    <DatePicker
      inline
      calendarClassName="miru-calendar-date-range"
      wrapperClassName="datePicker absolute"
      maxDate={
        selectedInput === fromInput && dateRange.to
          ? new Date(dateRange.to)
          : null
      }
      minDate={
        selectedInput === toInput && dateRange.from
          ? new Date(dateRange.from)
          : null
      }
      renderCustomHeader={({
        date,
        changeYear,
        changeMonth,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
      }) => (
        <div className="bg-miru-white-1000 ">
          <div className="mt-2 flex justify-start">
            <button onClick={hideCustomFilter}>
              <LeftArrowIcon color="#5b34ea" size={10} />
            </button>
            <p className="ml-2	text-sm font-medium"> Custom Date Range </p>
          </div>
          <div className="mt-4 flex flex-row">
            <input
              id={fromInput}
              name={fromInput}
              placeholder=" From "
              ref={textInput}
              type="text"
              className={`mr-1 h-8 w-32 rounded bg-miru-gray-100 p-1 ${
                selectedInput === fromInput &&
                "border-2 border-miru-han-purple-1000"
              }`}
              value={
                dateRange.from
                  ? dayjs(dateRange.from).format("DD MMM YYYY")
                  : null
              }
              onClick={onClickInput}
            />
            <input
              id={toInput}
              name={toInput}
              placeholder=" To "
              type="text"
              className={`ml-1 h-8 w-32 rounded bg-miru-gray-100 p-1 ${
                selectedInput === toInput &&
                "border-2 border-miru-han-purple-1000"
              }`}
              value={
                dateRange.to ? dayjs(dateRange.to).format("DD MMM YYYY") : null
              }
              onClick={onClickInput}
            />
          </div>
          <div className="headerWrapper mt-4">
            <button disabled={prevMonthButtonDisabled} onClick={decreaseMonth}>
              <CaretCircleLeftIcon color="#5b34ea" size={16} />
            </button>
            <div>
              <select
                value={months[getMonth(date)]}
                onChange={({ target: { value } }) =>
                  changeMonth(months.indexOf(value))
                }
              >
                {months.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={getYear(date)}
                onChange={({ target: { value } }) => changeYear(value)}
              >
                {years.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <button disabled={nextMonthButtonDisabled} onClick={increaseMonth}>
              <CaretCircleRightIcon color="#5b34ea" size={16} />
            </button>
          </div>
        </div>
      )}
      onChange={handleSelectDate}
    />
  );
};

export default CustomDateRangePicker;
