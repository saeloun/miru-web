import React, { useState } from "react";

import {
  quarter_four,
  quarter_one,
  quarter_three,
  quarter_two,
} from "constants/leaveType";

import CalendarHeader from "./CalendarHeader";
import QuarterlyCalendar from "./QuarterlyCalendar";
import { TileContentWrapper } from "./TileContent";

import Header from "../Header";

const LeaveBalance = () => {
  const [currentQuarter, setCurrentQuarter] = useState(0);
  const [currentYear, setCurrentYear] = useState(0);

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

  const annualLeave = [
    {
      date: "12-01-2023",
      name: "Family Function",
    },
  ];

  const partialAnnualLeave = [
    {
      date: "11-01-2023",
      name: "patial Annual leave",
    },
  ];

  const sickLeave = [
    {
      date: "10-01-2023",
      name: "Sick Leave",
    },
  ];

  const maternityLeave = [
    {
      date: "23-01-2023",
      name: "Maternity Leave",
    },
    {
      date: "24-01-2023",
      name: "Maternity Leave",
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

  const tileContent = ({ date }) =>
    TileContentWrapper({
      date,
      holiday,
      annualLeave,
      partialAnnualLeave,
      sickLeave,
      maternityLeave,
      upcomingOptionHoliday,
    });

  const yearCalendar = {
    0: {
      name: "Jan - Mar",
      quarter: quarter_one,
    },
    1: {
      name: "Apr - Jun",
      quarter: quarter_two,
    },
    2: {
      name: "Jul - Sept",
      quarter: quarter_three,
    },
    3: {
      name: "Oct - Dec",
      quarter: quarter_four,
    },
  };

  const onChangePrevQuarter = () => {
    if (currentQuarter === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentQuarter(3);
    } else {
      setCurrentQuarter(currentQuarter - 1);
    }
  };

  const onChangeNextQuarter = () => {
    if (currentQuarter === 3) {
      setCurrentYear(currentYear + 1);
      setCurrentQuarter(0);
    } else {
      setCurrentQuarter(currentQuarter + 1);
    }
  };

  return (
    <div className="flex w-4/5 flex-col">
      <Header
        cancelAction={() => {}} /* eslint-disable-line */
        isDisableUpdateBtn={false}
        saveAction={() => {}} /* eslint-disable-line */
        showButtons={false}
        subTitle=""
        title="Leave Balance"
      />
      <div className="mt-4 bg-miru-gray-100 p-10">
        <div className="flex w-full flex-row py-6">
          <div className="w-2/12 py-2 pl-2 pr-4 text-sm">My Leave Balance</div>
          <div className="flex w-9/12 flex-col">
            <div className="flex flex-row pb-3 pt-2">
              <div className="w-4/12">
                <div className="text-xs">Annual leaves</div>
                <div className="flex flex-row items-center">
                  {" "}
                  <div className="mr-4 h-4 w-4 rounded-2xl bg-miru-chart-green-600" />
                  12 days
                </div>
              </div>
              <div className="w-4/12">
                <div className="text-xs">Sick leaves</div>
                <div className="flex flex-row items-center">
                  {" "}
                  <div className="mr-4 h-4 w-4 rounded-2xl bg-miru-chart-orange-600" />
                  2 days
                </div>
              </div>
              <div className="w-4/12">
                <div className="text-xs">Maternity leaves</div>
                <div className="flex flex-row items-center">
                  {" "}
                  <div className="mr-4 h-4 w-4 rounded-2xl bg-miru-chart-blue-600" />
                  3 months
                </div>
              </div>
            </div>
            <div className="flex flex-row pt-3">
              <div className="w-4/12">
                <div className="text-xs">Period leaves</div>
                <div className="flex flex-row items-center">
                  {" "}
                  <div className="mr-4 h-4 w-4 rounded-2xl bg-miru-chart-blue-1000" />
                  7 days
                </div>
              </div>
              <div className="w-4/12">
                <div className="text-xs">Holidays</div>
                <div className="flex flex-row items-center">
                  {" "}
                  <div className="mr-4 h-4 w-4 rounded-2xl bg-miru-chart-pink-600" />
                  6 days
                </div>
              </div>
              <div className="w-4/12">
                <div className="text-xs">Optional Holidays</div>
                <div className="flex flex-row items-center">
                  {" "}
                  <div className="mr-4 h-4 w-4 rounded-2xl bg-miru-gray-500" />2
                  days
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CalendarHeader
        name={yearCalendar[currentQuarter].name}
        nextQuarter={onChangeNextQuarter}
        prevQuarter={onChangePrevQuarter}
      />
      <div className="mt-4">
        <QuarterlyCalendar
          quarterlyMap={yearCalendar[currentQuarter].quarter}
          tileContent={tileContent}
        />
      </div>
    </div>
  );
};

export default LeaveBalance;
