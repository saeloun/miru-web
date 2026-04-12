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
  maxDate,
}: CustomDatePickerProps) => {
  const range = (start, end) => {
    const ans = [];
    for (let i = start; i <= end; i++) {
      ans.push(i);
    }

    return ans;
  };

  const years = range(1920, getYear(maxDate || new Date()));
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

  const parseDate = dateValue => {
    if (!dateValue) return null;

    if (dateValue instanceof Date) return dateValue;

    if (dayjs.isDayjs(dateValue)) return dateValue.toDate();

    const parsedDate = dayjs(dateValue, dateFormat, true);

    return parsedDate.isValid() ? parsedDate.toDate() : null;
  };

  const formatDate = date => dayjs(date).format(dateFormat);
  const isAfterMaxDate = dateValue =>
    Boolean(maxDate && dayjs(dateValue).isAfter(dayjs(maxDate), "day"));

  if (!visibility) {
    return null;
  }

  return (
    <DatePicker
      inline
      calendarClassName="miru-calendar"
      selected={parseDate(date)}
      maxDate={maxDate}
      wrapperClassName="datePicker"
      renderCustomHeader={({
        date,
        changeYear,
        changeMonth,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
      }) => {
        const maxYear = maxDate ? getYear(maxDate) : null;
        const maxMonth = maxDate ? getMonth(maxDate) : null;
        const visibleYear = getYear(date);
        const visibleMonth = getMonth(date);
        const monthOptions =
          maxYear !== null && maxMonth !== null && visibleYear >= maxYear
            ? months.slice(0, maxMonth + 1)
            : months;

        const nextDisabled =
          nextMonthButtonDisabled ||
          (maxYear !== null &&
            maxMonth !== null &&
            visibleYear >= maxYear &&
            visibleMonth >= maxMonth);

        return (
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
                {monthOptions.map(option => (
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
            <button disabled={nextDisabled} onClick={increaseMonth}>
              <CaretCircleRightIcon color="#5b34ea" size={16} />
            </button>
          </div>
        );
      }}
      onChange={newDate => {
        if (!newDate || isAfterMaxDate(newDate)) return;

        handleChange(formatDate(newDate));
      }}
    />
  );
};

type CustomDatePickerProps = {
  visibility?: boolean;
  handleChange: any;
  date: any;
  setVisibility?: (_visibility: boolean) => any;
  wrapperRef?: any;
  dateFormat?: any;
  maxDate?: Date;
};

export default CustomDatePicker;
