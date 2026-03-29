import React from "react";

import { useTimesheetEntries } from "context/TimesheetEntries";
import { useUserContext } from "context/UserContext";
import { getNumberWithOrdinal } from "helpers";
import { Button, BUTTON_STYLES } from "StyledComponents";

const WeeklyEntries = () => {
  const { isDesktop } = useUserContext();
  const { view, dayInfo, selectDate, setSelectDate } = useTimesheetEntries();

  if (!isDesktop) {
    return null;
  }

  return (
    <>
      {view === "day" ? (
        <div className="flex h-16 justify-evenly bg-muted">
          {dayInfo?.map((d, index) => (
            <Button
              key={index}
              style={BUTTON_STYLES.calendarCell}
              className={`my-2 h-12 w-26 items-center rounded-xl border-2 border-transparent px-5 py-1 text-left ${
                index === selectDate && "border-primary bg-white"
              }`}
              onClick={() => {
                setSelectDate(index);
              }}
            >
              <p className="text-xs font-medium text-foreground">{d.day}</p>
              <p className="text-xs">
                {getNumberWithOrdinal(parseInt(d.date, 10))} {d.month}{" "}
              </p>
            </Button>
          ))}
        </div>
      ) : (
        // dates for week
        <div className="flex h-16 justify-between bg-muted px-15/100 xl:px-20/100">
          {dayInfo.map((d, index) => (
            <div
              className="my-2 h-12 w-24 items-center rounded-xl border-2 border-transparent py-2"
              key={index}
            >
              <p className="text-xs font-medium text-foreground">{d.day}</p>
              <p className="text-xs">
                {getNumberWithOrdinal(parseInt(d.date, 10))} {d.month}{" "}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default WeeklyEntries;
