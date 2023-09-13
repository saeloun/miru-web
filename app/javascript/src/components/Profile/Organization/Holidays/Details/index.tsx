import React from "react";

import dayjs from "dayjs";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

import HolidayModal from "../HolidaysModal";

const Details = ({
  toggleCalendarModal,
  optionalHolidayList,
  holidaysList,
  showCalendar,
}) => {
  const CalendarButton = ({ result, date, className }) => (
    <button
      className={`holiday-wrapper ${className}`}
      data-bs-placement="right"
      data-bs-toggle="tooltip"
      title={result.name}
    >
      {date.getDate()}
    </button>
  );

  const tileContent = ({ date }) => {
    let result;
    if (
      (result = holidaysList?.find(
        o => o.date === dayjs(date).format("DD-MM-YYYY")
      ))
    ) {
      return <CalendarButton className="holiday" date={date} result={result} />;
    }

    return <button>{date.getDate()}</button>;
  };

  return (
    <>
      <div className="mb-10 min-h-40v bg-miru-gray-100 p-4 lg:mt-4 lg:p-10">
        <div className="flex w-full flex-col py-6">
          <div className="flex w-full items-center justify-between text-sm">
            <span className="text-xl font-bold text-miru-dark-purple-1000">
              Public Holidays
            </span>
            <button
              className="mt-2 rounded border border-miru-han-purple-1000 px-1 text-xs text-miru-han-purple-1000"
              onClick={toggleCalendarModal}
            >
              View Calendar
            </button>
          </div>
          <table>
            <TableHeader />
            <tbody>
              {holidaysList.length ? (
                holidaysList.map((holiday, index) => (
                  <TableRow holiday={holiday} key={index} />
                ))
              ) : (
                <div>No data found</div>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="min-h-40v bg-miru-gray-100 p-4 lg:mt-4 lg:p-10">
        <div className="flex w-full flex-col py-6">
          <div className="flex w-full items-center justify-between text-sm">
            <span className="text-xl font-bold text-miru-dark-purple-1000">
              Optional Holidays
            </span>
            <button
              className="mt-2 rounded border border-miru-han-purple-1000 px-1 text-xs text-miru-han-purple-1000"
              onClick={toggleCalendarModal}
            >
              View Calendar
            </button>
          </div>
          <table>
            <TableHeader />
            <tbody>
              {optionalHolidayList.length > 0 ? (
                optionalHolidayList.map((holiday, index) => (
                  <TableRow holiday={holiday} key={index} />
                ))
              ) : (
                <div>No Data found</div>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showCalendar && (
        <HolidayModal
          showCalendar={showCalendar}
          tileContent={tileContent}
          toggleCalendarModal={toggleCalendarModal}
        />
      )}
    </>
  );
};

export default Details;
