import React from "react";

import { getMonth, getYear } from "date-fns";
import { useOutsideClick } from "helpers";
import { CaretCircleLeftIcon, CaretCircleRightIcon } from "miruIcons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type CustomDatePickerProps = {
  handleChange: any;
  date: any;
  setVisibility?: any;
  wrapperRef?: any;
};

const CustomDatePicker = ({
  handleChange,
  date,
  setVisibility,
  wrapperRef,
}: CustomDatePickerProps) => {
  const range = (start, end) => {
    const ans = [];
    for (let i = start; i <= end; i++) {
      ans.push(i);
    }

    return ans;
  };

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

  useOutsideClick(wrapperRef, () => {
    setVisibility(false);
  });

  return (
    <DatePicker
      inline
      calendarClassName="miru-calendar"
      selected={date}
      wrapperClassName="datePicker"
      renderCustomHeader={({
        date,
        changeYear,
        changeMonth,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
      }) => (
        <div className="headerWrapper">
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
      )}
      onChange={handleChange}
    />
  );
};

export default CustomDatePicker;
