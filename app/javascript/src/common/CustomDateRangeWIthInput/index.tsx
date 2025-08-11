import React, { useEffect, useRef, useState } from "react";

import { getMonth, getYear } from "date-fns";
import dayjs from "dayjs";
import { CaretCircleLeftIcon, CaretCircleRightIcon } from "miruIcons";
import PropTypes from "prop-types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  validDateFormats,
  months,
  CUSTOM_DATE_RANGE_ERRORS,
} from "../CustomDateRangePicker/utils";

interface DateRange {
  from: string;
  to: string;
}

const CustomDateRangeWithInput = ({
  handleSelectDate,
  onClickInput,
  selectedInput,
  dateRange,
  setSelectedInput = (inputFieldName: string) => {}, // eslint-disable-line
  setIsDisableDoneBtn = (isDisableDoneBtn: boolean) => {}, // eslint-disable-line
  submitCustomDatePicker,
  wrapperRef,
  showCustomCalendar,
  handleOpenDateCalendar,
  setShowCustomCalendar,
}) => {
  const fromInput = "from-input";
  const toInput = "to-input";
  const [errors, setErrors] = useState({
    fromInput: "",
    toInput: "",
  });
  const [isValidDateRange, setIsValidDateRange] = useState<boolean>(true);

  const range = (start, end) =>
    Array.from({ length: end - start }, (_v, k) => k + start);

  const years = range(1990, getYear(new Date()) + 1);
  const textInput = useRef(null);
  const toInputRef = useRef(null);

  useEffect(() => {
    setSelectedInput(fromInput);
    textInput.current.focus();
    resetErrors("fromInput");
  }, [setSelectedInput, resetErrors]);

  useEffect(() => {
    if (
      document.activeElement == toInputRef.current ||
      document.activeElement == textInput.current
    ) {
      setShowCustomCalendar(true);
    }
  }, [setShowCustomCalendar]);

  const handleDateInputChange = (dateInput: string, fieldName: string) => {
    const showErrorMsg = !dateInput?.trim();
    const isValidDate = validateDateInput(dateInput, fieldName, showErrorMsg);
    setValidDate(dateInput, fieldName, isValidDate);
    submitCustomDatePicker();
  };

  const setValidDate = (
    dateInput: string,
    fieldName: string,
    isValidDate = false
  ) => {
    if (isValidDate) {
      handleSelectDate(dateInput);
      if (isValidDateRange && errors[fieldName] && fieldName) {
        resetErrors(fieldName);
      }
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
    const isValidDate = checkIsValidDateFormat(dateInput);
    const {
      isDateRangeValid,
      dateRangeErrorMessage,
      showDateRangeErrorMessage,
    } = checkIsValidDateRange(isValidDate, dateInput, dateRange, fieldName);
    let errorMsg = "";

    if (!isValidDate) {
      if (showErrorMsg) {
        showDateInputErrorMessage(dateInput, fieldName, errorMsg);
      }
      setIsDisableDoneBtn(true);
    } else if (
      showDateRangeErrorMessage &&
      dateRangeErrorMessage?.trim() &&
      !isDateRangeValid
    ) {
      showErrorMsg = true;
      errorMsg = dateRangeErrorMessage;
      showDateInputErrorMessage(dateInput, fieldName, errorMsg);
      setIsDisableDoneBtn(true);
    } else {
      showErrorMsg = false;
      errorMsg = "";
      resetErrors(fieldName);
      setIsDisableDoneBtn(false);
    }

    return isValidDate || false;
  };

  const checkIsValidDateFormat = (dateInput: string) =>
    dayjs(dateInput).isValid() &&
    validDateFormats.some(
      (validFormat: string) =>
        dayjs(dateInput).format(validFormat) == dateInput ||
        new Date(dateInput).toString() == dateInput
    );

  const checkIsValidDateRange = (
    isValidDate = false,
    dateInput = "",
    dateRange: DateRange,
    fieldName = "",
    showDateRangeErrorMessage?: boolean
  ) => {
    let isDateRangeValid = false;
    let dateRangeErrorMessage = "";

    if (!isValidDate) {
      return {
        isDateRangeValid,
        dateRangeErrorMessage,
        showDateRangeErrorMessage: false,
      };
    }

    if (isValidDate && fieldName == "fromInput" && dateRange.to) {
      isDateRangeValid =
        dayjs(dateInput).isBefore(dateRange.to, "day") ||
        dayjs(dateInput).isSame(dateRange.to, "day");

      dateRangeErrorMessage =
        CUSTOM_DATE_RANGE_ERRORS.FROM_DATE_IS_NOT_BEFORE_TO_DATE;
    } else if (isValidDate && fieldName == "toInput" && dateRange.from) {
      isDateRangeValid =
        dayjs(dateInput).isAfter(dateRange.from, "day") ||
        dayjs(dateInput).isSame(dateRange.from, "day");

      dateRangeErrorMessage =
        CUSTOM_DATE_RANGE_ERRORS.TO_DATE_IS_NOT_AFTER_FROM_DATE;
    }
    setIsValidDateRange(isDateRangeValid);

    if (isDateRangeValid) {
      resetErrors("toInput");
      resetErrors("fromInput");
    } else {
      showDateRangeErrorMessage = showDateRangeErrorMessage || true;
    }

    return {
      isDateRangeValid,
      dateRangeErrorMessage,
      showDateRangeErrorMessage,
    };
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
        errorMsg = CUSTOM_DATE_RANGE_ERRORS.BLANK_DATE;
      } else {
        errorMsg = CUSTOM_DATE_RANGE_ERRORS.INVALID_DATE;
      }
    }

    setErrors(prevError => ({
      ...prevError,
      [fieldName]: errorMsg,
    }));
  };

  return (
    <div ref={wrapperRef}>
      <div className="mt-1 ml-12 flex lg:flex-col xl:flex-row">
        <div className="ml-1" onClick={handleOpenDateCalendar}>
          <input
            id={fromInput}
            name={fromInput}
            placeholder=" From "
            ref={textInput}
            type="text"
            className={`mr-1 h-8 w-32 rounded bg-miru-gray-100 p-1 text-sm text-miru-dark-purple-1000 ${
              selectedInput === fromInput &&
              "border-2 border-miru-han-purple-1000"
            }`}
            value={
              dateRange.from ? dayjs(dateRange.from).format("DD MMM YYYY") : ""
            }
            onChange={e => handleDateInputChange(e.target.value, "fromInput")}
            onClick={onClickInput}
          />
          {errors.fromInput && (
            <div className="mx-2 mt-1 mb-5 block text-left text-xs tracking-wider text-red-600">
              {errors.fromInput}
            </div>
          )}
        </div>
        <div onClick={handleOpenDateCalendar}>
          <input
            id={toInput}
            name={toInput}
            placeholder=" To "
            ref={toInputRef}
            type="text"
            className={`ml-1 h-8 w-32 rounded bg-miru-gray-100 p-1 text-sm text-miru-dark-purple-1000 ${
              selectedInput === toInput &&
              "border-2 border-miru-han-purple-1000"
            }`}
            value={
              dateRange.to ? dayjs(dateRange.to).format("DD MMM YYYY") : ""
            }
            onChange={e => handleDateInputChange(e.target.value, "toInput")}
            onClick={onClickInput}
          />
          {errors.toInput && (
            <div className="mx-2 mt-1 mb-5 block text-left text-xs tracking-wider text-red-600">
              {errors.toInput}
            </div>
          )}
        </div>
      </div>
      <div className="absolute z-20 mt-1 ml-10 flex flex-col  overflow-y-auto rounded-lg bg-miru-white-1000 shadow-c1 lg:ml-2 xl:ml-10">
        {showCustomCalendar && (
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
                <div className="headerWrapper mt-4">
                  <button
                    disabled={prevMonthButtonDisabled}
                    onClick={decreaseMonth}
                  >
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
                  <button
                    disabled={nextMonthButtonDisabled}
                    onClick={increaseMonth}
                  >
                    <CaretCircleRightIcon color="#5b34ea" size={16} />
                  </button>
                </div>
              </div>
            )}
            selected={
              selectedInput === fromInput ? dateRange.from : dateRange.to
            }
            onChange={date => {
              const fieldName =
                selectedInput == fromInput ? "fromInput" : "toInput";
              handleSelectDate(date);
              validateDateInput(date, fieldName);
              if (selectedInput == fromInput && !dateRange.to) {
                toInputRef.current.focus();
                toInputRef.current.click(onClickInput);
                resetErrors("toInput");
              } else {
                setShowCustomCalendar(false);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

CustomDateRangeWithInput.propTypes = {
  handleSelectDate: PropTypes.func,
  onClickInput: PropTypes.func,
  selectedInput: PropTypes.string,
  dateRange: PropTypes.any,
  setSelectedInput: PropTypes.func,
  setIsDisableDoneBtn: PropTypes.func,
  submitCustomDatePicker: PropTypes.func,
  wrapperRef: PropTypes.any,
  showCustomCalendar: PropTypes.bool,
  handleOpenDateCalendar: PropTypes.any,
  setShowCustomCalendar: PropTypes.any,
};

export default CustomDateRangeWithInput;
