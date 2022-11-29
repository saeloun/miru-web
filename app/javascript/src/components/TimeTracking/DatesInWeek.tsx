import React from "react";

import { getNumberWithOrdinal } from "helpers";

const WeeklyEntries: React.FC<Iprops> = ({
  view,
  dayInfo,
  selectDate,
  setSelectDate,
}) =>
  view === "day" ? (
    <div className="flex h-16 justify-evenly bg-miru-gray-100">
      {dayInfo.map((d, index) => (
        <button
          key={index}
          className={`my-2 h-12 w-26 items-center rounded-xl border-2 border-transparent px-5 py-1 text-left ${
            index === selectDate && "border-miru-han-purple-1000 bg-white"
          }`}
          onClick={() => {
            setSelectDate(index);
          }}
        >
          <p className="text-xs font-medium text-miru-dark-purple-1000">
            {d.day}
          </p>
          <p className="text-xs">
            {getNumberWithOrdinal(parseInt(d.date, 10))} {d.month}{" "}
          </p>
        </button>
      ))}
    </div>
  ) : (
    // dates for week
    <div className="flex h-16 justify-items-stretch bg-miru-gray-100 px-60">
      {dayInfo.map((d, index) => (
        <div
          className="my-2 h-12 w-24 items-center rounded-xl border-2 border-transparent py-2"
          key={index}
        >
          <p className="text-xs font-medium text-miru-dark-purple-1000">
            {d.day}
          </p>
          <p className="text-xs">
            {getNumberWithOrdinal(parseInt(d.date, 10))} {d.month}{" "}
          </p>
        </div>
      ))}
    </div>
  );

interface Iprops {
  view: string;
  dayInfo: any[];
  selectDate: number;
  setSelectDate: any;
}

export default WeeklyEntries;
