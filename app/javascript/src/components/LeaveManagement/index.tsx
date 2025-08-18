import React, { useEffect, useState } from "react";

import holidaysApi from "apis/holidays";
import timeoffEntryApi from "apis/timeoffEntry";
import Loader from "common/Loader/index";
import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";
import { getYear, format } from "date-fns";

import Container from "./Container";
import Header from "./Header";

const LeaveManagement = () => {
  const { isDesktop, user, isAdminUser } = useUserContext();

  const [isLoading, setIsLoading] = useState(true);
  const [timeoffEntries, setTimeoffEntries] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(user?.id || null);
  const [totalTimeoffEntriesDuration, setTotalTimeoffEntriesDuration] =
    useState(0);
  const [currentYear, setCurrentYear] = useState(getYear(new Date()));
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);
  const [filterTimeoffEntries, setFilterTimeoffEntries] = useState([]);
  const [filterTimeoffEntriesDuration, setFilterTimeoffEntriesDuration] =
    useState(0);
  const [optionalTimeoffEntries, setOptionalTimeoffEntries] = useState([]);
  const [nationalTimeoffEntries, setNationalTimeoffEntries] = useState([]);
  const [optionalHolidayList, setOptionalHolidayList] = useState<Array<any>>(
    []
  );

  const [nationalHolidayList, setNationalHolidayList] = useState<Array<any>>(
    []
  );

  const fetchHolidayData = async () => {
    const res = await holidaysApi.allHolidays();
    const holidays = res.data.holidays;
    if (holidays.length) {
      setOptionalHolidayList(
        holidays.map(holiday => ({
          optional_holidays: holiday.optional_holidays,
          year: holiday.year,
        }))
      );

      setNationalHolidayList(
        holidays.map(holiday => ({
          national_holidays: holiday.national_holidays,
          year: holiday.year,
        }))
      );
    }
  };

  useEffect(() => {
    if (user && !selectedEmployeeId) {
      setSelectedEmployeeId(user.id);
    }
  }, [user]);

  useEffect(() => {
    fetchHolidayData();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchTimeoffEntries();
    }
  }, [selectedEmployeeId, currentYear]);

  useEffect(() => {
    handlefilterTimeoffEntries(
      timeoffEntries,
      totalTimeoffEntriesDuration,
      selectedLeaveType
    );
  }, [selectedLeaveType]);

  const fetchTimeoffEntries = async () => {
    const res = await timeoffEntryApi.get(selectedEmployeeId, currentYear);
    const {
      timeoffEntries,
      employees,
      leaveBalance,
      totalTimeoffEntriesDuration,
      optionalTimeoffEntries,
      nationalTimeoffEntries,
    } = res.data;

    setSelectedLeaveType(null);
    setTimeoffEntries(timeoffEntries);
    setEmployees(employees);
    setLeaveBalance(leaveBalance);
    setTotalTimeoffEntriesDuration(totalTimeoffEntriesDuration);
    setOptionalTimeoffEntries(optionalTimeoffEntries);
    setNationalTimeoffEntries(nationalTimeoffEntries);
    handlefilterTimeoffEntries(
      timeoffEntries,
      totalTimeoffEntriesDuration,
      null
    );
    setIsLoading(false);
  };

  const handlefilterTimeoffEntries = (
    timeoffEntries,
    totalTimeoffEntriesDuration,
    selectedLeaveType
  ) => {
    if (selectedLeaveType) {
      let sortedTimeoffEntries = [];
      if (selectedLeaveType.id == "optional") {
        sortedTimeoffEntries = optionalTimeoffEntries;
      } else if (selectedLeaveType.id == "national") {
        sortedTimeoffEntries = nationalTimeoffEntries;
      } else {
        sortedTimeoffEntries =
          timeoffEntries.length &&
          timeoffEntries.filter(
            timeoffEntry => timeoffEntry.leaveType?.id === selectedLeaveType.id
          );
      }

      const leaveType = leaveBalance.find(
        item => item.id == selectedLeaveType.id
      );

      setFilterTimeoffEntries(sortedTimeoffEntries);
      setFilterTimeoffEntriesDuration(leaveType.timeoffEntriesDuration);
    } else {
      setFilterTimeoffEntries(timeoffEntries);
      setFilterTimeoffEntriesDuration(totalTimeoffEntriesDuration);
    }
  };

  const employeeList = employees.map(e => ({
    value: `${e["id"]}`,
    label: `${e["first_name"]} ${e["last_name"]}`,
  }));

  const LeaveManagementLayout = () => {
    if (isLoading || !user) {
      return <Loader />;
    }

    const getLeaveBalanaceDateText = () => {
      const presentYear = getYear(new Date());
      let date = new Date(currentYear, 11, 31);
      if (currentYear == presentYear) {
        date = new Date();
      }

      return `Balance Until ${format(date, "do MMM yyyy")}`;
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Header
            currentYear={currentYear}
            employeeList={employeeList}
            isAdminUser={isAdminUser}
            selectedEmployeeId={selectedEmployeeId}
            setCurrentYear={setCurrentYear}
            setSelectedEmployeeId={setSelectedEmployeeId}
          />
          <Container
            getLeaveBalanaceDateText={getLeaveBalanaceDateText}
            leaveBalance={leaveBalance}
            nationalHolidayList={nationalHolidayList}
            optionalHolidayList={optionalHolidayList}
            selectedLeaveType={selectedLeaveType}
            setSelectedLeaveType={setSelectedLeaveType}
            timeoffEntries={filterTimeoffEntries}
            totalTimeoffEntriesDuration={filterTimeoffEntriesDuration}
          />
        </div>
      </div>
    );
  };

  const Main = withLayout(LeaveManagementLayout, !isDesktop, !isDesktop);

  return isDesktop ? LeaveManagementLayout() : <Main />;
};

export default LeaveManagement;
