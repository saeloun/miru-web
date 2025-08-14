import React from "react";

import { useTimesheetEntries } from "context/TimesheetEntries";
import dayjs from "dayjs";
import { minToHHMM } from "helpers";

const CalendarCell = ({ dayNum, weekInfo, handleWeekday }) => {
  const today = dayjs().format("YYYY-MM-DD");
  const { selectedFullDate, setSelectDate } = useTimesheetEntries();

  return (
    <div
      className={`flex h-14 w-16 cursor-pointer justify-end rounded-md border-2 bg-white p-1 xl:w-24
                    ${
                      weekInfo[dayNum]["date"] === selectedFullDate
                        ? "border-miru-han-purple-1000"
                        : "border-transparent"
                    }`}
      onClick={() => {
        handleWeekday(weekInfo[dayNum].date);
        setSelectDate(dayNum);
      }}
    >
      <div>
        <div className="flex justify-end">
          <p
            className={`text-xs font-medium ${
              weekInfo[dayNum]["date"] === today
                ? "rounded-xl bg-miru-han-purple-1000 px-2 text-miru-white-1000"
                : "text-miru-dark-purple-200"
            }`}
          >
            {weekInfo[dayNum]["day"]}
          </p>
        </div>
        <p className="mx-auto text-xl text-miru-dark-purple-1000 xl:mx-3 xl:text-2xl">
          {(() => {
            if (weekInfo[dayNum]["totalDuration"] > 0) {
              return minToHHMM(weekInfo[dayNum]["totalDuration"]);
            } else if (weekInfo[dayNum]["date"] < today) {
              return "00:00";
            }

            return "";
          })()}
        </p>
      </div>
    </div>
  );
};

export default CalendarCell;
