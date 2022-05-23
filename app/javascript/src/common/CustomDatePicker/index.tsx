import React from "react";
import DatePicker from "react-datepicker";
import { getMonth, getYear } from "date-fns";
import { CaretCircleLeft, CaretCircleRight } from "phosphor-react";

import "react-datepicker/dist/react-datepicker.css";

const CustomDatePicker = ({ handleChange, dueDate }) => {
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
    "Febr",
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
      wrapperClassName="datePicker absolute"
      inline
      calendarClassName="miru-calendar"
      selected={dueDate}
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
            <CaretCircleLeft color="#5b34ea" size={16} />
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
            <CaretCircleRight color="#5b34ea" size={16} />
          </button>
        </div>
      )}
      onChange={(date) => handleChange(date)}
    />
  );
};

export default CustomDatePicker;
