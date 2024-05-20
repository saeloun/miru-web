import React from "react";

import dayjs from "dayjs";
import { CalendarIcon } from "miruIcons";

import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import { ErrorSpan } from "common/ErrorSpan";

const DatePickerWithInputBox = ({
  ref,
  handleDatePickerVisibility,
  isDatePickerVisible,
  dateFormat,
  isError,
  errorMessage,
  handleDateChange,
  date,
  id,
  label,
}) => (
  <div className="flex w-1/2 cursor-pointer flex-col" ref={ref}>
    <div
      className="field relative flex w-full flex-col px-2"
      id={id}
      onClick={handleDatePickerVisibility}
    >
      <CustomInputText
        disabled
        id={id}
        label={label}
        name={id}
        type="text"
        value={date || ""}
      />
      <CalendarIcon
        className="absolute top-0 bottom-0 right-4 my-auto"
        color="#5B34EA"
        size={20}
      />
    </div>
    {isError && (
      <ErrorSpan className="text-xs text-red-600" message={errorMessage} />
    )}
    {isDatePickerVisible && (
      <CustomDatePicker
        date={date || dayjs()}
        dateFormat={dateFormat}
        handleChange={handleDateChange}
      />
    )}
  </div>
);

export default DatePickerWithInputBox;
