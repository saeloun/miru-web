import React from "react";

import DashboardRoutes from "./Home";
import DashboardLayout from "./DashboardLayout";
import { useUserContext } from "context/UserContext";

const Dashboard = props => {
  const userContext = useUserContext();

  const user = props.user || userContext.user;
  const companyRole = props.companyRole || userContext.companyRole;
  const isAdminUser =
    props.isAdminUser !== undefined
      ? props.isAdminUser
      : userContext.isAdminUser;
  const { isDesktop } = props;

  const dashboardRouteProps = {
    ...props,
    user,
    companyRole,
    isAdminUser,
    isDesktop,
    company: userContext.company || props.company,
  };

  return (
    <DashboardLayout>
      <DashboardRoutes {...dashboardRouteProps} />
    </DashboardLayout>
  );
};

export default Dashboard;
