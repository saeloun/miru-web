import React from "react";

import { MinusIcon, PlusIcon } from "miruIcons";

import CustomDateRangeWithInput from "common/CustomDateRangeWIthInput";
import CustomRadioButton from "common/CustomRadio";

const DateRangeFilter = ({
  setIsClientOpen,
  setIsStatusOpen,
  setIsDateRangeOpen,
  isDateRangeOpen,
  filters,
  dateRangeList,
  showCustomFilter,
  dateRange,
  handleSelectDate,
  selectedInput,
  onClickInput,
  submitCustomDatePicker,
  handleSelectFilter,
  wrapperRef,
}) => (
  <div className="relative cursor-pointer border-b border-miru-gray-200 pb-5 pt-6 text-miru-dark-purple-1000 hover:text-miru-han-purple-1000">
    <div
      className="flex items-center justify-between px-5"
      onClick={() => {
        setIsStatusOpen(false);
        setIsClientOpen(false);
        setIsDateRangeOpen(!isDateRangeOpen);
      }}
    >
      <h5 className="text-xs font-bold leading-4 tracking-wider">DATE RANGE</h5>
      <div className="flex items-center">
        {filters.dateRange.value != "all" && (
          <span className="mr-7 flex h-5 w-5 items-center justify-center rounded-full bg-miru-han-purple-1000 text-xs font-semibold text-white">
            {1}
          </span>
        )}
        {isDateRangeOpen ? <MinusIcon size={16} /> : <PlusIcon size={16} />}
      </div>
    </div>
    {isDateRangeOpen && (
      <div className="lg:mt-7">
        {dateRangeList.map(dateRange => (
          <CustomRadioButton
            classNameWrapper="px-5 py-2.5"
            defaultCheck={dateRange.value == filters.dateRange.value}
            groupName="dateRange"
            id={dateRange.value}
            key={dateRange.value}
            label={dateRange.label}
            value={dateRange.value}
            handleOnChange={event =>
              handleSelectFilter(dateRange, event.target)
            }
          />
        ))}
      </div>
    )}
    {isDateRangeOpen && showCustomFilter && (
      <CustomDateRangeWithInput
        dateRange={dateRange}
        handleSelectDate={handleSelectDate}
        selectedInput={selectedInput}
        submitCustomDatePicker={submitCustomDatePicker}
        wrapperRef={wrapperRef}
        onClickInput={onClickInput}
      />
    )}
  </div>
);

export default DateRangeFilter;
