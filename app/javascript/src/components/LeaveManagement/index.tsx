import React from "react";

import { CalendarIcon, UserIcon } from "miruIcons";

import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";

import Container from "./Container";
import Header from "./Header";

const LeaveManagement = () => {
  const { isDesktop } = useUserContext();
  const leaveTypes = [
    {
      icon: <CalendarIcon />,
      color: "#0E79B2",
      leaveType: "Annual Leave",
      leaveHours: "96",
    },
    {
      icon: <UserIcon />,
      color: "#058C42",
      leaveType: "Casual Leave",
      leaveHours: "182",
    },
    {
      icon: <UserIcon />,
      color: "#F39237",
      leaveType: "Casual Leave",
      leaveHours: "182",
    },
    {
      icon: <UserIcon />,
      color: "#C97CC1",
      leaveType: "Casual Leave",
      leaveHours: "182",
    },
    {
      icon: <UserIcon />,
      color: "#058C42",
      leaveType: "Casual Leave",
      leaveHours: "182",
    },
  ];

  const LeaveManagementLayout = () => (
    <div className="h-full w-full py-6">
      <Header />
      <Container leaveTypes={leaveTypes} />
    </div>
  );

  const Main = withLayout(LeaveManagementLayout, !isDesktop, !isDesktop);

  return isDesktop ? LeaveManagementLayout() : <Main />;
};

export default LeaveManagement;
