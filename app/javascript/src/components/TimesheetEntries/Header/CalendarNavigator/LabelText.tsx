import React from "react";

import { useTimesheetEntries } from "components/TimesheetEntries/context/TimesheetEntriesContext";
import { useUserContext } from "context/UserContext";

function LabelText() {
  const {
    view = "month",
    dayInfo = [],
    selectDate,
    monthsAbbr = [],
    currentMonthNumber = 0,
    currentYear = 0,
  } = useTimesheetEntries();
  const { isDesktop } = useUserContext();

  const getLabelText = () => {
    if (view === "month") {
      return (
        <>
          <span className="mr-2">
            {monthsAbbr[Math.abs(currentMonthNumber)]}
          </span>
          <span>{currentYear}</span>
        </>
      );
    }

    if (view === "week") {
      return (
        <>
          <span>
            {parseInt(dayInfo[0]["date"], 10)} {dayInfo[0]["month"]} -
          </span>
          <span className="mx-1">
            {parseInt(dayInfo[6]["date"], 10)} {dayInfo[6]["month"]}
          </span>
          <span> {dayInfo[6]["year"]}</span>
        </>
      );
    }

    if (view === "day") {
      return isDesktop ? (
        <>
          <span>
            {parseInt(dayInfo[0]["date"], 10)} {dayInfo[0]["month"]} -
          </span>
          <span className="mx-1">
            {parseInt(dayInfo[6]["date"], 10)} {dayInfo[6]["month"]}
          </span>
          <span> {dayInfo[6]["year"]}</span>
        </>
      ) : (
        <>
          <span>{parseInt(dayInfo[selectDate]["date"], 10)}</span>
          <span className="mx-1">{dayInfo[selectDate].month}</span>
          <span>{dayInfo[selectDate]["year"]}</span>
        </>
      );
    }
  };

  return getLabelText();
}

export default LabelText;
