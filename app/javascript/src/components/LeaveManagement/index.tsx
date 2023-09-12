import React from "react";

import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";

import Container from "./Container";
import Header from "./Header";

const LeaveManagement = () => {
  const { isDesktop } = useUserContext();
  const leaveTypes = [];

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
