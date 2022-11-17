/* eslint-disable import/order  */
import React, { useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import { getMonth, getYear } from "date-fns";
import dayjs from "dayjs";
import "react-datepicker/dist/react-datepicker.css";
import { CaretCircleLeftIcon, CaretCircleRightIcon, LeftArrowIcon } from "miruIcons"; //eslint-disable-line

const CustomDateRangePicker = ({
  hideCustomFilter,
  handleSelectDate,
  onClickInput,
  selectedInput,
  dateRange
}) => {
  const fromInput = "from-input";
  const toInput = "to-input";

  const range = (start, end) => Array.from({ length: (end - start) }, (v, k) => k + start);

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

  const textInput = useRef(null);
  useEffect(() => {
    textInput.current.focus();
  }, []);

  return (
    <DatePicker
      wrapperClassName="datePicker absolute"
      inline
      calendarClassName="miru-calendar-date-range"
      minDate={(selectedInput === toInput && dateRange.from) ? new Date(dateRange.from) : null}
      maxDate={(selectedInput === fromInput && dateRange.to) ? new Date(dateRange.to) : null}
      renderCustomHeader={({
        date,
        changeYear,
        changeMonth,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled
      }) => (
        <div className="bg-miru-white-1000 ">
          <div className="flex justify-start mt-2">
            <button onClick={hideCustomFilter}>
              <LeftArrowIcon color="#5b34ea" size={10} />
            </button>
            <p className="text-sm	font-medium ml-2"> Custom Date Range </p>
          </div>
          <div className="flex flex-row mt-4">
            <input
              type={"text"}
              placeholder={" From "}
              value={dateRange.from ? dayjs(dateRange.from).format("DD MMM YYYY") : null}
              ref={textInput}
              className={`bg-miru-gray-100 h-8 w-32 mr-1 rounded p-1 ${selectedInput === fromInput && "border-2 border-miru-han-purple-1000"}`}
              onClick={onClickInput}
              id={fromInput}
              name={fromInput}
            />
            <input
              type={"text"}
              placeholder={" To "}
              value={dateRange.to ? dayjs(dateRange.to).format("DD MMM YYYY") : null}
              className={`bg-miru-gray-100 h-8 w-32 ml-1 rounded p-1 ${selectedInput === toInput && "border-2 border-miru-han-purple-1000"}`}
              onClick={onClickInput}
              id={toInput}
              name={toInput}
            />
          </div>
          <div
            className="headerWrapper mt-4"
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
        </div>
      )}
      onChange={handleSelectDate}
    />
  );
};

export default CustomDateRangePicker;
