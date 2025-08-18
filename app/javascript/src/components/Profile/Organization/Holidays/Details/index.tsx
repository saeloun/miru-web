import React, { Fragment } from "react";

import HolidayModal from "common/HolidayModal";
import CustomYearPicker from "common/CustomYearPicker";
import dayjs from "dayjs";
import { Tooltip } from "StyledComponents";
import { Calendar } from "phosphor-react";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const Details = ({
  currentYear,
  setCurrentYear,
  dateFormat,
  editAction,
  holidaysList,
  optionalHolidayList,
  showCalendar,
  toggleCalendarModal,
}) => {
  const CalendarButton = ({ content, date, className }) => (
    <div className={`holiday-wrapper ${className}`}>
      <Tooltip className="tooltip" content={content.name}>
        <span>{date.getDate()}</span>
      </Tooltip>
    </div>
  );

  const tileContent = ({ date }) => {
    const presentDate = dayjs(date).format(dateFormat);
    const isHoliday = holidaysList?.find(
      holiday => holiday.date === presentDate
    );

    const isOptionalHoliday = optionalHolidayList?.find(
      holiday => holiday.date === presentDate
    );

    if (isHoliday || isOptionalHoliday) {
      return (
        <CalendarButton
          className={isHoliday ? "holiday" : "optional-holiday"}
          content={isHoliday || isOptionalHoliday}
          date={date}
        />
      );
    }

    return <button>{date.getDate()}</button>;
  };

  return (
    <Fragment>
      <div className="flex h-16 items-center justify-between bg-miru-han-purple-1000 p-4 pl-10 text-white">
        <span className="text-2xl font-bold">Holidays</span>
        <CustomYearPicker
          currentYear={currentYear}
          setCurrentYear={setCurrentYear}
        />
        <div className="flex items-center gap-2">
          <button
            className="px-4 py-1.5 rounded-md bg-white/20 text-white text-sm font-bold hover:bg-white/30 transition-colors duration-200"
            onClick={editAction}
          >
            Edit
          </button>
          <button
            className="p-1.5 rounded-md border border-white/20 bg-transparent text-white hover:bg-white/10 transition-colors duration-200"
            onClick={toggleCalendarModal}
            title="View Calendar"
          >
            <Calendar className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mb-10 min-h-40v bg-miru-gray-100 p-4 lg:mt-4 lg:p-10">
        <div className="flex w-full flex-col py-6">
          <div className="flex w-full items-center justify-between text-sm">
            <span className="text-xl font-bold text-miru-dark-purple-1000">
              Public Holidays
            </span>
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
          currentYear={currentYear}
          setCurrentYear={setCurrentYear}
          showCalendar={showCalendar}
          tileContent={tileContent}
          toggleCalendarModal={toggleCalendarModal}
        />
      )}
    </Fragment>
  );
};

export default Details;
