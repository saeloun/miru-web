/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";

import { getMonth, getYear } from "date-fns";
import dayjs from "dayjs";
import {
  CaretCircleLeftIcon,
  CaretCircleRightIcon,
  LeftArrowIcon,
} from "miruIcons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { validDateFormats, months } from "./utils";

const CustomDateRangePicker = ({
  hideCustomFilter,
  handleSelectDate,
  onClickInput,
  selectedInput,
  dateRange,
  setSelectedInput = (inputFieldName: string) => {}, // eslint-disable-line
  setIsDisableDoneBtn = (isDisableDoneBtn: boolean) => {}, // eslint-disable-line
}) => {
  const fromInput = "from-input";
  const toInput = "to-input";
  const [errors, setErrors] = useState({
    fromInput: "",
    toInput: "",
  });

  const range = (start, end) =>
    Array.from({ length: end - start }, (v, k) => k + start);

  const years = range(1990, getYear(new Date()) + 1);
  const textInput = useRef(null);
  useEffect(() => {
    setSelectedInput(fromInput);
    textInput.current.focus();
    resetErrors("fromInput");
  }, []);

  const handleDateInputOnBlur = (dateInput: string, fieldName: string) => {
    if (dateInput) {
      const isValidDate = validateDateInput(dateInput, fieldName);
      setValidDate(dateInput, fieldName, isValidDate);
    }
  };

  const handleDateInputChange = (dateInput: string, fieldName: string) => {
    const showErrorMsg = !dateInput?.trim();
    const isValidDate = validateDateInput(dateInput, fieldName, showErrorMsg);
    setValidDate(dateInput, fieldName, isValidDate);
  };

  const setValidDate = (
    dateInput: string,
    fieldName: string,
    isValidDate = false
  ) => {
    if (isValidDate) {
      handleSelectDate(dateInput);
      resetErrors(fieldName);
    } else {
      handleSelectDate("");
    }
  };

  const resetErrors = (fieldName: string) => {
    setErrors(prevError => ({
      ...prevError,
      [fieldName]: "",
    }));
  };

  const validateDateInput = (
    dateInput: string,
    fieldName: string,
    showErrorMsg = true
  ) => {
    const isValidDate =
      dayjs(dateInput).isValid() &&
      validDateFormats.some(
        (validFormat: string) =>
          dayjs(dateInput).format(validFormat) == dateInput ||
          new Date(dateInput).toString() == dateInput
      );
    if (!isValidDate) {
      if (showErrorMsg) {
        showDateInputErrorMessage(dateInput, fieldName);
      }
      setIsDisableDoneBtn(true);
    } else {
      resetErrors(fieldName);
      setIsDisableDoneBtn(false);
    }

    return isValidDate || false;
  };

  const showDateInputErrorMessage = (
    dateInput: string,
    fieldName: string,
    errorMessage?: string
  ) => {
    let errorMsg = "";
    if (errorMessage?.trim() && fieldName) {
      errorMsg = errorMessage;
    } else {
      if (!dateInput?.trim()) {
        errorMsg = "Date can not be blank";
      } else {
        errorMsg = "Please enter a valid date";
      }
    }

    setErrors(prevError => ({
      ...prevError,
      [fieldName]: errorMsg,
    }));
  };

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
            <p className="ml-2 text-sm font-medium"> Custom Date Range </p>
          </div>
          <div className="mt-4 flex flex-row">
            <div className="ml-1">
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
                onBlur={e => handleDateInputOnBlur(e.target.value, "fromInput")}
                onClick={onClickInput}
                onChange={e =>
                  handleDateInputChange(e.target.value, "fromInput")
                }
              />
              <div className="mx-2 mt-1 mb-5 block text-left text-xs tracking-wider text-red-600">
                {errors.fromInput && <div>{errors.fromInput}</div>}
              </div>
            </div>
            <div>
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
                  dateRange.to
                    ? dayjs(dateRange.to).format("DD MMM YYYY")
                    : null
                }
                onBlur={e => handleDateInputOnBlur(e.target.value, "toInput")}
                onChange={e => handleDateInputChange(e.target.value, "toInput")}
                onClick={onClickInput}
              />
              <div className="mx-2 mt-1 mb-5 block text-left text-xs tracking-wider text-red-600">
                {errors.toInput && <div>{errors.toInput}</div>}
              </div>
            </div>
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
      onChange={date => {
        const fieldName = selectedInput == fromInput ? "fromInput" : "toInput";
        handleSelectDate(date);
        validateDateInput(date, fieldName);
      }}
    />
  );
};

export default CustomDateRangePicker;
