import React, { useEffect, useRef, useState } from "react";

import { getMonth, getYear } from "date-fns";
import dayjs from "dayjs";
import { LeftArrowIcon } from "miruIcons";
import { CaretLeft, CaretRight } from "phosphor-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { i18n } from "../../i18n";

import { validDateFormats, months, CUSTOM_DATE_RANGE_ERRORS } from "./utils";

interface DateRange {
  from: string;
  to: string;
}

const CustomDateRangePicker = ({
  hideCustomFilter,
  handleSelectDate,
  onClickInput,
  selectedInput,
  dateRange,
  setSelectedInput = (inputFieldName: string) => {},
  setIsDisableDoneBtn = (isDisableDoneBtn: boolean) => {},
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

  function resetErrors(fieldName: string) {
    setErrors(prevError => ({
      ...prevError,
      [fieldName]: "",
    }));
  }

  useEffect(() => {
    setSelectedInput(fromInput);
    textInput.current.focus();
    resetErrors("fromInput");
  }, [setSelectedInput, resetErrors]);

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
      if (isValidDateRange && errors[fieldName] && fieldName) {
        resetErrors(fieldName);
      }
    } else {
      handleSelectDate("");
    }
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
    <DatePicker
      inline
      calendarClassName="miru-datepicker miru-datepicker--range"
      wrapperClassName="datePicker absolute miru-datepicker-wrapper"
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
        <div className="bg-background">
          <div className="mt-2 flex justify-start">
            <button
              type="button"
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-primary hover:bg-accent"
              onClick={hideCustomFilter}
            >
              <LeftArrowIcon color="currentColor" size={10} />
            </button>
            <p className="ml-2 text-sm font-medium">
              {i18n.t("customDateRange")}
            </p>
          </div>
          <div className="mt-4 flex flex-row">
            <div className="ml-1">
              <input
                id={fromInput}
                name={fromInput}
                placeholder={i18n.t("from")}
                ref={textInput}
                type="text"
                className={`mr-1 h-9 w-36 rounded-md border border-input bg-background px-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                  selectedInput === fromInput && "border-primary"
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
                placeholder={i18n.t("to")}
                ref={toInputRef}
                type="text"
                className={`ml-1 h-9 w-36 rounded-md border border-input bg-background px-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                  selectedInput === toInput && "border-primary"
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
              <select
                className="miru-datepicker-select"
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
              type="button"
              className="miru-datepicker-nav-btn"
              disabled={nextMonthButtonDisabled}
              onClick={increaseMonth}
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      )}
      onChange={date => {
        const fieldName = selectedInput == fromInput ? "fromInput" : "toInput";
        handleSelectDate(date);
        validateDateInput(date, fieldName);
        if (selectedInput == fromInput && !dateRange.to) {
          toInputRef.current.focus();
          toInputRef.current.click(onClickInput);
          resetErrors("toInput");
        }
      }}
    />
  );
};

export default CustomDateRangePicker;
