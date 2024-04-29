import React, { useEffect, useState } from "react";

import { getYear, format } from "date-fns";

import holidaysApi from "apis/holidays";
import timeoffEntryApi from "apis/timeoffEntry";
import Loader from "common/Loader/index";
import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";

import Container from "./Container";
import Header from "./Header";

const LeaveManagement = () => {
  const { isDesktop, user, isAdminUser } = useUserContext();

  const [isLoading, setIsLoading] = useState(true);
  const [timeoffEntries, setTimeoffEntries] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(user.id);
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
    setOptionalHolidayList(res.data.holidays[0].optional_holidays);
    setNationalHolidayList(res.data.holidays[0].national_holidays);
  };

  useEffect(() => {
    fetchHolidayData();
  }, []);

  useEffect(() => {
    fetchTimeoffEntries();
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
    if (isLoading) {
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
      <div className="h-full w-full py-6">
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
    );
  };

  const Main = withLayout(LeaveManagementLayout, !isDesktop, !isDesktop);

  return isDesktop ? LeaveManagementLayout() : <Main />;
};

export default LeaveManagement;
