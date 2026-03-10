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

const defaultYearClassName = "outline-none appearance-none bg-transparent";

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
    <div
      className={classNames(
        "inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-1.5 shadow-sm",
        defaultWrapperClassName,
        wrapperClassName
      )}
    >
      <button
        className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:text-muted-foreground"
        onClick={handlePrevious}
        type="button"
      >
        <CaretCircleLeftIcon size={13} weight="bold" />
      </button>
      {currentYear && (
        <select
          className={classNames(
            "min-w-[5.5rem] px-1 text-center text-sm font-semibold text-foreground",
            defaultYearClassName,
            yearClassName
          )}
          value={currentYear}
          onChange={e => handleOnChange(e.target.value)}
        >
          {years.map((year, index) => (
            <option
              className="text-base font-medium"
              key={`year${index}`}
              value={year}
            >
              {year}
            </option>
          ))}
        </select>
      )}
      <button
        className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:text-muted-foreground"
        disabled={isNextYearButtonDisabled}
        onClick={handleNext}
        type="button"
      >
        {isNextYearButtonDisabled ? (
          <CaretCircleRightIcon
            className="text-muted-foreground"
            size={13}
            weight="bold"
          />
        ) : (
          <CaretCircleRightIcon size={13} weight="bold" />
        )}
      </button>
    </div>
  );
};

export default CustomYearPicker;
