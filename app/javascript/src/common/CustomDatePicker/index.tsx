import React from "react";

import { getMonth, getYear } from "date-fns";
import dayjs from "dayjs";
import { useOutsideClick } from "helpers";
import { CaretCircleLeftIcon, CaretCircleRightIcon } from "miruIcons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const CustomDatePicker = ({
  handleChange,
  date,
  visibility = true,
  setVisibility,
  wrapperRef,
  dateFormat,
}: CustomDatePickerProps) => {
  const range = (start, end) => {
    const ans = [];
    for (let i = start; i <= end; i++) {
      ans.push(i);
    }

    return ans;
  };

  const years = range(1920, getYear(new Date()) + 1);
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

  const parseDate = dateString => dayjs(dateString, dateFormat).toDate();

  const formatDate = date => dayjs(date).format(dateFormat);

  if (!visibility) {
    return null;
  }

  return (
    <DatePicker
      inline
      calendarClassName="miru-calendar"
      selected={parseDate(date)}
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
      onChange={newDate => handleChange(formatDate(newDate))}
    />
  );
};

type CustomDatePickerProps = {
  visibility?: boolean;
  handleChange: any;
  date: any;
  setVisibility?: (visibility: boolean) => any;
  wrapperRef?: any;
  dateFormat?: any;
};

export default CustomDatePicker;
