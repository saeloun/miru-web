import React from "react";

import dayjs from "dayjs";

import { Divider } from "common/Divider";
import { repitationTypeObj } from "constants/leaveType";

import HolidayModal from "./HolidaysModal";

const Details = ({ showCalendar, toggleCalendarModal, wrapperRef }) => {
  const holiday = [
    {
      date: "26-01-2023",
      name: "Republic Day",
    },
    {
      date: "19-02-2023",
      name: "shivjayanti",
    },
  ];

  const upcomingOptionHoliday = [
    {
      date: "31-01-2023",
      name: "optional Holiday",
    },
    {
      date: "10-01-2023",
      name: "optional Holiday",
    },
  ];

  const leaveBalanceList = [
    {
      leaveType: "annual",
      total: 0,
      countType: "days",
      repetitionType: "per_year",
      carryforwardedCount: 0,
    },
    {
      leaveType: "sick",
      total: 0,
      countType: "days",
      repetitionType: "per_year",
      carryforwardedCount: 0,
    },
    {
      leaveType: "maternity",
      total: 0,
      countType: "days",
      repetitionType: "per_year",
      carryforwardedCount: 0,
    },
    {
      leaveType: "paternity",
      total: 0,
      countType: "days",
      repetitionType: "per_quarter",
      carryforwardedCount: 0,
    },
    {
      leaveType: "period",
      total: 0,
      countType: "days",
      repetitionType: "per_month",
      carryforwardedCount: 0,
    },
  ];

  const holidaysList = [
    {
      date: "26-01-2023",
      name: "Republic Day",
    },
    {
      date: "19-02-2023",
      name: "shivjayanti",
    },
  ];
  const totalOptionalHolidays = 1;
  const optionalRepetitionType = "per_year";
  const optionalHolidayList = holidaysList;

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
      (result = holiday.find(o => o.date === dayjs(date).format("DD-MM-YYYY")))
    ) {
      return <CalendarButton className="holiday" date={date} result={result} />;
    } else if (
      (result = upcomingOptionHoliday.find(
        o => o.date === dayjs(date).format("DD-MM-YYYY")
      ))
    ) {
      return (
        <CalendarButton
          className="optional-holiday"
          date={date}
          result={result}
        />
      );
    }

    return <button>{date.getDate()}</button>;
  };

  return (
    <div className="mt-4 min-h-80v bg-miru-gray-100 p-10">
      <div className="flex w-full flex-row py-6">
        <div className="w-2/12 p-2 text-sm">Leave Balance</div>
        <div className="flex w-10/12 flex-col">
          {leaveBalanceList.map((leaveBalance, index) => (
            <div className=" flex w-full flex-row" key={index}>
              <div className="w-4/12 p-2">
                <div className="text-xs">Leave type</div>
                <div className="text-base">{leaveBalance.leaveType}</div>
              </div>
              <div className="w-4/12 p-2">
                <div className="text-xs">Total</div>
                <div className="text-base">
                  {leaveBalance.total} {leaveBalance.countType}{" "}
                  {repitationTypeObj[leaveBalance.repetitionType]}
                </div>
              </div>
              <div className="w-4/12 p-2">
                <div className="text-xs">Carry forward</div>
                <div className="text-base">
                  {leaveBalance.carryforwardedCount} days
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Divider />
      <div className="flex w-full flex-row py-6">
        <div className="w-2/12 p-2 text-sm">
          <div>Holidays</div>
          <div>
            <button
              className="mt-2 rounded border border-miru-han-purple-1000 px-1 text-xs text-miru-han-purple-1000"
              onClick={toggleCalendarModal}
            >
              View Calendar
            </button>
          </div>
        </div>
        <div className="flex w-10/12 flex-col">
          {holidaysList.map((holiday, index) => (
            <div className="w-fullflex-row flex" key={index}>
              <div className="w-1/2 p-2">
                <div className="text-xs">Date</div>
                <div className="text-base">{holiday.date}</div>
              </div>
              <div className="w-1/2 p-2">
                <div className="text-xs">Name</div>
                <div className="text-base">{holiday.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Divider />
      <div className="flex w-full flex-row py-6">
        <div className="w-2/12 p-2 text-sm">
          <div>Optional</div>
          <div>Holidays</div>
          <div>
            <button
              className="mt-2 rounded border border-miru-han-purple-1000 px-1 text-xs text-miru-han-purple-1000"
              onClick={toggleCalendarModal}
            >
              View Calendar
            </button>
          </div>
        </div>
        <div className="flex w-10/12 flex-col">
          <div className="p-2">
            <div className="text-xs">Total optional holidays</div>
            <div className="text-base">
              {totalOptionalHolidays}{" "}
              {repitationTypeObj[optionalRepetitionType]}
            </div>
          </div>
          {optionalHolidayList.map((holiday, index) => (
            <div className="flex w-full flex-row" key={index}>
              <div className="w-1/2 p-2">
                <div className="text-xs">Date</div>
                <div className="text-base">{holiday.date}</div>
              </div>
              <div className="w-1/2 p-2">
                <div className="text-xs">Name</div>
                <div className="text-base">{holiday.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showCalendar && (
        <HolidayModal
          tileContent={tileContent}
          toggleCalendarModal={toggleCalendarModal}
          wrapperRef={wrapperRef}
        />
      )}
    </div>
  );
};

export default Details;
