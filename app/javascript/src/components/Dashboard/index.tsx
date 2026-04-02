import React, { useEffect } from "react";

import DashboardRoutes from "./Home";
import DashboardLayout from "./DashboardLayout";
import { useUserContext } from "context/UserContext";

const Dashboard = props => {
  const userContext = useUserContext();

  // Use context data if props are not available (for client-side navigation)
  const user = props.user || userContext.user;
  const companyRole = props.companyRole || userContext.companyRole;
  const isAdminUser =
    props.isAdminUser !== undefined
      ? props.isAdminUser
      : userContext.isAdminUser;
  const { isDesktop, setIsDesktop } = props;

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 1023);
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [setIsDesktop]);

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
