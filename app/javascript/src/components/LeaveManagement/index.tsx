import React, { useEffect, useState } from "react";

import { getYear } from "date-fns";

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
    } = res.data;

    setSelectedLeaveType(null);
    setTimeoffEntries(timeoffEntries);
    setEmployees(employees);
    setLeaveBalance(leaveBalance);
    setTotalTimeoffEntriesDuration(totalTimeoffEntriesDuration);
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
      const sortedTimeoffEntries =
        timeoffEntries.length &&
        selectedLeaveType &&
        timeoffEntries.filter(
          timeoffEntry => timeoffEntry.leaveType?.id === selectedLeaveType.id
        );

      const leaveType = leaveBalance.find(
        item => item.id === selectedLeaveType.id
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
          currentYear={currentYear}
          leaveBalance={leaveBalance}
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
