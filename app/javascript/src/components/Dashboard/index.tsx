import React, { useEffect } from "react";

import Home from "./Home";
import Sidebar from "../Navbar/Sidebar";
import ModernLayout from "./ModernLayout";
import { useUserContext } from "context/UserContext";
import { useThemeOptional } from "contexts/ThemeContext";
import GlobalThemeToggle from "../Global/ThemeToggle";

const Dashboard = props => {
  const userContext = useUserContext();
  const themeContext = useThemeOptional();
  const layoutMode = themeContext?.layoutMode || "classic";

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

  // Use modern layout when layout mode is "modern"
  if (layoutMode === "modern") {
    return (
      <>
        <ModernLayout>
          <Home {...homeProps} />
        </ModernLayout>
      </>
    );
  }

  // Use enhanced classic layout with sidebar
  if (isDesktop) {
    return (
      <div className="flex h-screen w-full">
        <Sidebar />
        <div className="flex-1 lg:pl-16 lg:data-[sidebar-expanded=true]:pl-64 pb-16 lg:pb-0 p-4 md:p-6">
          <Home {...homeProps} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <Home {...homeProps} />
      <GlobalThemeToggle />
    </div>
  );
};

export default Dashboard;
