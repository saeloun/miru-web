import React, { useEffect, useState } from "react";

import { getYear } from "date-fns";

import timeoffEntryApi from "apis/timeoffEntry";
import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";

import Container from "./Container";
import Header from "./Header";

const LeaveManagement = () => {
  const { isDesktop, user, isAdminUser } = useUserContext();

  const [timeoffEntries, setTimeoffEntries] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(user.id);
  const [totalTimeoffEntriesDuration, setTotalTimeoffEntriesDuration] =
    useState(0);

  const currentYear = getYear(new Date());

  useEffect(() => {
    fetchTimeoffEntries();
  }, [selectedEmployeeId]);

  const fetchTimeoffEntries = async () => {
    const res = await timeoffEntryApi.get(selectedEmployeeId, currentYear);
    const {
      timeoffEntries,
      employees,
      leaveBalance,
      totalTimeoffEntriesDuration,
    } = res.data;
    setTimeoffEntries(timeoffEntries);
    setEmployees(employees);
    setLeaveBalance(leaveBalance);
    setTotalTimeoffEntriesDuration(totalTimeoffEntriesDuration);
  };

  const employeeList = employees.map(e => ({
    value: `${e["id"]}`,
    label: `${e["first_name"]} ${e["last_name"]}`,
  }));

  const LeaveManagementLayout = () => (
    <div className="h-full w-full py-6">
      <Header
        employeeList={employeeList}
        isAdminUser={isAdminUser}
        selectedEmployeeId={selectedEmployeeId}
        setSelectedEmployeeId={setSelectedEmployeeId}
      />
      <Container
        currentYear={currentYear}
        leaveBalance={leaveBalance}
        timeoffEntries={timeoffEntries}
        totalTimeoffEntriesDuration={totalTimeoffEntriesDuration}
      />
    </div>
  );

  const Main = withLayout(LeaveManagementLayout, !isDesktop, !isDesktop);

  return isDesktop ? LeaveManagementLayout() : <Main />;
};

export default LeaveManagement;
