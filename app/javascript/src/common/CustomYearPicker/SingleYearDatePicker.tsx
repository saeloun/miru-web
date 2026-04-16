import React from "react";

import { getMonth } from "date-fns";
import dayjs from "dayjs";
import { useOutsideClick } from "helpers";
import { CaretLeft, CaretRight } from "phosphor-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type SingleYearDatePickerProps = {
  handleChange: any;
  date: any;
  setVisibility?: any;
  wrapperRef?: any;
  dateFormat?: any;
  selectedYear: any;
};

const SingleYearDatePicker = ({
  handleChange,
  date,
  setVisibility,
  wrapperRef,
  dateFormat,
  selectedYear = new Date().getFullYear(),
}: SingleYearDatePickerProps) => {
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
    setVisibility?.(false);
  });

  const parseDate = dateString => dayjs(dateString, dateFormat).toDate();

  const formatDate = date => dayjs(date).format(dateFormat);

  return (
    <DatePicker
      inline
      calendarClassName="miru-datepicker miru-datepicker--single"
      maxDate={dayjs(`${selectedYear}-12-31`).toDate()}
      minDate={dayjs(`${selectedYear}-01-01`).toDate()}
      selected={parseDate(date)}
      wrapperClassName="datePicker miru-datepicker-wrapper"
      renderCustomHeader={({
        date,
        changeMonth,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
      }) => (
        <div className="headerWrapper">
          <button
            type="button"
            className="miru-datepicker-nav-btn"
            disabled={prevMonthButtonDisabled}
            onClick={decreaseMonth}
          >
            <CaretLeft size={14} weight="bold" />
          </button>
          <div>
            <select
              className="miru-datepicker-select"
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
          </div>
          <button
            type="button"
            className="miru-datepicker-nav-btn"
            disabled={nextMonthButtonDisabled}
            onClick={increaseMonth}
          >
            <CaretRight size={14} weight="bold" />
          </button>
        </div>
      )}
      onChange={newDate => handleChange(formatDate(newDate))}
    />
  );
};

export default SingleYearDatePicker;
