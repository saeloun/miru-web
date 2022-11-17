import React from "react";

import { getMonth, getYear } from "date-fns";
import { CaretCircleLeftIcon, CaretCircleRightIcon } from "miruIcons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const CustomDatePicker = ({ handleChange, date }) => {
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
    "Dec"
  ];
  return (
    <DatePicker
      wrapperClassName="datePicker"
      inline
      calendarClassName="miru-calendar"
      selected={date}
      renderCustomHeader={({
        date,
        changeYear,
        changeMonth,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled
      }) => (
        <div
          className="headerWrapper"
        >
          <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled}>
            <CaretCircleLeftIcon color="#5b34ea" size={16} />
          </button>
          <div>
            <select
              value={months[getMonth(date)]}
              onChange={({ target: { value } }) =>
                changeMonth(months.indexOf(value))
              }
            >
              {months.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={getYear(date)}
              onChange={({ target: { value } }) => changeYear(value)}
            >
              {years.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <button onClick={increaseMonth} disabled={nextMonthButtonDisabled}>
            <CaretCircleRightIcon color="#5b34ea" size={16} />
          </button>
        </div>
      )}
      onChange={handleChange}
    />
  );
};

export default CustomDatePicker;
