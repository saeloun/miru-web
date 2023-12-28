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
  const [leaveTypes, setLeaveTypes] = useState([]);
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
    setTimeoffEntries(res.data.timeoffEntries);
    setEmployees(res.data.employees);
    setLeaveTypes(res.data.leaveBalance);
    setTotalTimeoffEntriesDuration(res.data.totalTimeoffEntriesDuration);
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
        leaveTypes={leaveTypes}
        timeoffEntries={timeoffEntries}
        totalTimeoffEntriesDuration={totalTimeoffEntriesDuration}
      />
    </div>
  );

  const Main = withLayout(LeaveManagementLayout, !isDesktop, !isDesktop);

  return isDesktop ? LeaveManagementLayout() : <Main />;
};

export default LeaveManagement;
