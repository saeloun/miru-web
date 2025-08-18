import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Home from "./Home";
import DashboardLayout from "./DashboardLayout";
import DashboardHome from "./DashboardHome";
import { useUserContext } from "context/UserContext";

const Dashboard = props => {
  const userContext = useUserContext();
  const location = useLocation();

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

  const homeProps = {
    ...props,
    user,
    companyRole,
    isAdminUser,
    isDesktop,
    company: userContext.company || props.company,
  };

  // Check if we're at the root dashboard
  // Only show DashboardHome on the exact root path
  const isDashboardRoot = location.pathname === "/dashboard";

  // Wrap everything in DashboardLayout to get the sidebar
  return (
    <DashboardLayout>
      <Home {...homeProps} />
    </DashboardLayout>
  );
};

export default Dashboard;
