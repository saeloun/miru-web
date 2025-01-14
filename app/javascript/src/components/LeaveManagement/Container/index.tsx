import React, { Fragment, useState } from "react";

import { getYear } from "date-fns";
import dayjs from "dayjs";
import { minToHHMM, companyDateFormater } from "helpers";
import { XIcon, CalendarIcon } from "miruIcons";
import { Button, Tooltip } from "StyledComponents";

import { Divider } from "common/Divider";
import HolidayModal from "common/HolidayModal";
import { useUserContext } from "context/UserContext";

import LeaveBlock from "./LeaveBlock";
import Table from "./Table";

const Container = ({
  getLeaveBalanaceDateText,
  leaveBalance,
  timeoffEntries,
  totalTimeoffEntriesDuration,
  selectedLeaveType,
  setSelectedLeaveType,
  optionalHolidayList,
  nationalHolidayList,
}) => {
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [currentYear, setCurrentYear] = useState<number>(getYear(new Date()));
  const { company } = useUserContext();
  const dateFormat = companyDateFormater(company?.date_format);
  const toggleCalendarModal = () => setShowCalendar(!showCalendar);

  const HolidayButton = ({ content, date, className }) => (
    <div className={`holiday-wrapper ${className}`}>
      <Tooltip className="tooltip" content={content.name}>
        <span>{date.getDate()}</span>
      </Tooltip>
    </div>
  );

  const tileContent = ({ date }) => {
    const currentDate = dayjs(date).format(dateFormat);
    const currentYearNationalHolidayList = nationalHolidayList.find(
      holiday => holiday.year == currentYear
    ).national_holidays;

    const isHoliday = currentYearNationalHolidayList?.find(
      holiday => holiday.date === currentDate
    );

    const isOptionalHoliday = optionalHolidayList?.find(
      holiday => holiday.date === currentDate
    );

    if (isHoliday || isOptionalHoliday) {
      return (
        <HolidayButton
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
      <div className="mx-4 my-6 h-full lg:mx-0">
        <div className="flex w-full items-center justify-between">
          <p className="text-base font-normal text-miru-dark-purple-1000 lg:text-2xl">
            {getLeaveBalanaceDateText()}
          </p>
          <Button
            className="flex items-center text-center text-xs font-bold lg:px-4"
            style="secondary"
            onClick={toggleCalendarModal}
          >
            <CalendarIcon
              className="mr-2 text-miru-han-purple-1000 lg:hidden"
              size={16}
              weight="bold"
            />
            <span className="lg:hidden">Holiday</span>
            <span className="hidden lg:block">View Holiday Calendar</span>
          </Button>
        </div>
        <div className="mt-6 grid w-full gap-4 lg:grid-cols-3">
          {leaveBalance.map((leaveType, index) => (
            <LeaveBlock
              key={index}
              leaveType={leaveType}
              selectedLeaveType={selectedLeaveType}
              setSelectedLeaveType={setSelectedLeaveType}
            />
          ))}
        </div>
        <div className="mt-10">
          <div className="flex items-center justify-between py-3 lg:py-5">
            <div className="flex items-center">
              <span className="mr-4 text-lg font-bold text-miru-dark-purple-1000 lg:text-xl">
                Leave Details
              </span>
              {selectedLeaveType && (
                <div className="flex items-center justify-center rounded-xl bg-miru-gray-400 px-3 py-1 lg:mx-2 lg:my-0">
                  <span className="tracking-wide text-base font-normal capitalize text-miru-dark-purple-1000">
                    {selectedLeaveType.name}
                  </span>
                  <XIcon
                    className="ml-2 cursor-pointer"
                    size={14}
                    onClick={() => setSelectedLeaveType(null)}
                  />
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-miru-dark-purple-1000 lg:text-base">
              Total :
              <span className="font-bold">
                {minToHHMM(totalTimeoffEntriesDuration)}
              </span>
            </p>
          </div>
          <Divider />
          <Table timeoffEntries={timeoffEntries} />
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

export default Container;
