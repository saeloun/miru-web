import React from "react";

import classNames from "classnames";
import { CaretCircleLeftIcon, CaretCircleRightIcon } from "miruIcons";

type customYearPickerProps = {
  wrapperClassName?: string;
  yearClassName?: string;
  currentYear: number;
  setCurrentYear: React.Dispatch<React.SetStateAction<number>>;
  nextYearButtonDisabled?: boolean;
};

const defaultWrapperClassName = "flex items-center justify-center";

const defaultYearClassName =
  "outline-none appearance-none bg-transparent text-white";

const CustomYearPicker = ({
  wrapperClassName,
  yearClassName,
  currentYear,
  setCurrentYear,
  nextYearButtonDisabled = false,
}: customYearPickerProps) => {
  const range = (start, end) => {
    const ans = [];
    for (let i = start; i <= end; i++) {
      ans.push(i);
    }

    return ans;
  };

  const years = range(1920, currentYear + 1);
  const actualYear = new Date().getFullYear();
  const isNextYearButtonDisabled = nextYearButtonDisabled
    ? currentYear >= actualYear
    : false;

  const handleOnChange = selected => {
    const current = parseInt(selected);
    setCurrentYear(current);
  };

  const handlePrevious = () => {
    setCurrentYear(currentYear - 1);
  };

  const handleNext = () => {
    setCurrentYear(currentYear + 1);
  };

  return (
    <div className={classNames(defaultWrapperClassName, wrapperClassName)}>
      <button className="pr-2" onClick={handlePrevious}>
        <CaretCircleLeftIcon size={13} weight="bold" />
      </button>
      {currentYear && (
        <select
          className={classNames(defaultYearClassName, yearClassName)}
          value={currentYear}
          onChange={e => handleOnChange(e.target.value)}
        >
          {years.map((year, index) => (
            <option
              className="text-base font-medium text-white"
              key={`year${index}`}
              value={year}
            >
              {year}
            </option>
          ))}
        </select>
      )}
      <button
        className="pl-2"
        disabled={isNextYearButtonDisabled}
        onClick={handleNext}
      >
        {isNextYearButtonDisabled ? (
          <CaretCircleRightIcon color="#ADA4CE" size={13} weight="bold" />
        ) : (
          <CaretCircleRightIcon size={13} weight="bold" />
        )}
      </button>
    </div>
  );
};

export default CustomYearPicker;
