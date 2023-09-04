import React, { useState } from "react";

import { getYear } from "date-fns";
import { CaretCircleLeftIcon, CaretCircleRightIcon } from "miruIcons";

const CustomYearPicker = () => {
  const [currentYear, setCurrentYear] = useState(getYear(new Date()) + 1);

  const range = (start, end) => {
    const ans = [];
    for (let i = start; i <= end; i++) {
      ans.push(i);
    }

    return ans;
  };
  const years = range(1920, getYear(new Date()) + 1);

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
    <div className="flex flex-auto flex-row items-center justify-center">
      <button className="pr-2" onClick={handlePrevious}>
        <CaretCircleLeftIcon size={13} weight="bold" />
      </button>
      {currentYear && (
        <select
          className="outline-none appearance-none bg-transparent text-white"
          onChange={e => handleOnChange(e.target.value)}
        >
          <option
            className="text-base font-medium text-white"
            value={currentYear}
          >
            {currentYear}
          </option>
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
      <button className="pl-2" onClick={handleNext}>
        <CaretCircleRightIcon size={13} weight="bold" />
      </button>
    </div>
  );
};

export default CustomYearPicker;
