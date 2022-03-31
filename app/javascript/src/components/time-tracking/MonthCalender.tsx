/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import dayjs from "dayjs";

const { useState, useEffect } = React;

const MonthCalender: React.FC<Iprops> = ({ dayInfo }) => {
  const weekCount =  (year: number, monthNumber: number) => {
    const firstOfMonth = new Date(year, monthNumber, 1);
    const lastOfMonth = new Date(year, monthNumber, 0);
    const used = firstOfMonth.getDay() + 6 + lastOfMonth.getDate();
    return Math.ceil( used / 7);
  };

  const [firstDay, setFirstDay] = useState<number>(dayjs().startOf("month").day());
  const [lastDay, setLastDay] = useState<number>(dayjs().endOf("month").day());

  return (
    <div className='p-4 bg-miru-gray-100'>
      <div className="bg-miru-gray-100 flex justify-between mb-4">
        {dayInfo.map((d, index) => (
          <div
            key={index}
            className="text-center text-xs text-miru-dark-purple-1000 font-medium py-2 my-2 w-28 items-center rounded-xl border-2 border-transparent"
          >
            {d.day}
          </div>
        ))}
        <div
          key="8"
          className="text-center text-xs text-miru-dark-purple-1000 font-medium py-2 my-2 w-28 items-center rounded-xl border-2 border-transparent"
        >
          Total
        </div>
      </div>
      {
        [1, 2, 4, 4].map(() => (
          <div className="my-4 bg-miru-gray-100 flex justify-between">
            {[1, 2, 3, 4, 5, 6, 7].map(() => (
              <div className="h-16 w-26 bg-white rounded-md">
              </div>
            ))}
            <div className="h-16 w-28 bg-white rounded-md">
            </div>
          </div>
        ))
      }
    </div>
  );
};

interface Iprops {
  dayInfo: any[];
  selectDate: number;
  setSelectDate: any;
  currentMonthNumber: number;
  currentYear: number;
  entryList: object;
}

export default MonthCalender;
