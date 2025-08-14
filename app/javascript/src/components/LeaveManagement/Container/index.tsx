import React, { Fragment, useState } from "react";

import { Divider } from "common/Divider";
import { useUserContext } from "context/UserContext";
import { getYear } from "date-fns";
import dayjs from "dayjs";
import { minToHHMM, companyDateFormater } from "helpers";
import { X, CalendarDays, Eye } from "lucide-react";
import { Button } from "../../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import HolidayCalendarModal from "../HolidayCalendarModal";

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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`holiday-wrapper ${className}`}>
            <span>{date.getDate()}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{content.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const tileContent = ({ date }) => {
    const currentDate = dayjs(date).format(dateFormat);
    const currentYearNationalHolidayList =
      nationalHolidayList.find(holiday => holiday.year == currentYear)
        ?.national_holidays || [];

    const isHoliday = currentYearNationalHolidayList?.find(
      holiday => holiday.date === currentDate
    );

    const currentYearOptionalHolidayList =
      optionalHolidayList?.find(holiday => holiday.year == currentYear)
        ?.optional_holidays || [];

    const isOptionalHoliday = currentYearOptionalHolidayList?.find(
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
            variant="outline"
            size="sm"
            onClick={toggleCalendarModal}
            className="flex items-center gap-2 border-miru-han-purple-1000 text-miru-han-purple-1000 hover:bg-miru-han-purple-1000 hover:text-white transition-all duration-200 font-semibold shadow-sm"
          >
            <CalendarDays className="h-4 w-4 lg:hidden" />
            <Eye className="hidden lg:block h-4 w-4" />
            <span className="lg:hidden">Holidays</span>
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
                  <X
                    className="ml-2 h-3.5 w-3.5 cursor-pointer"
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
      <HolidayCalendarModal
        isOpen={showCalendar}
        onClose={toggleCalendarModal}
        currentYear={currentYear}
        setCurrentYear={setCurrentYear}
        tileContent={tileContent}
      />
    </Fragment>
  );
};

export default Container;
