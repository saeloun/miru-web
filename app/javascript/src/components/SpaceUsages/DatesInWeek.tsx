import * as React from "react";

import { getNumberWithOrdinal } from "helpers";

const WeeklyEntries: React.FC<Iprops> = ({
  view,
  dayInfo,
  selectDate,
  setSelectDate
}) => (
  view === "day" ? (
    <div className="h-16 bg-miru-gray-100 flex justify-evenly">
      {dayInfo.map((d, index) => (
        <button
          onClick={() => {
            setSelectDate(index);
          }}
          key={index}
          className={
            "px-5 py-1 my-2 w-26 h-12 text-left items-center rounded-xl border-2 border-transparent " +
            (index === selectDate &&
              "bg-white border-miru-han-purple-1000")
          }
        >
          <p className="text-xs text-miru-dark-purple-1000 font-medium">
            {d.day}
          </p>
          <p className="text-xs">
            {getNumberWithOrdinal(d.date)} {d.month}{" "}
          </p>
        </button>
      ))}
    </div>
  ) : (
    // dates for week
    <div className="h-16 px-60 bg-miru-gray-100 flex justify-items-stretch">
      {dayInfo.map((d, index) => (
        <div
          key={index}
          className="py-2 my-2 w-24 h-12 items-center rounded-xl border-2 border-transparent"
        >
          <p className="text-xs text-miru-dark-purple-1000 font-medium">
            {d.day}
          </p>
          <p className="text-xs">
            {getNumberWithOrdinal(d.date)} {d.month}{" "}
          </p>
        </div>
      ))}
    </div>
  )
);

interface Iprops {
  view: string;
  dayInfo: any[];
  selectDate: number;
  setSelectDate: any;
}

export default WeeklyEntries;
