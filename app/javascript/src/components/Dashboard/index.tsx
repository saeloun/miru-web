import React, { useEffect } from "react";

import Home from "./Home";
import Navbar from "../Navbar";
import Sidebar from "../Navbar/Sidebar";
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
  const [useModernLayout, setUseModernLayout] = React.useState(true);

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

  if (useModernLayout) {
    return (
      <div className="flex h-screen w-full">
        <Sidebar />
        <div className="flex-1 lg:pl-16 lg:data-[sidebar-expanded=true]:pl-64 pb-16 lg:pb-0">
          <Home {...homeProps} />
        </div>
      </div>
    );
  }

  // Fallback to old layout if needed
  if (isDesktop) {
    return (
      <div className="absolute inset-0 flex h-full w-full">
        <Navbar companyRole={companyRole} user={user} />
        <Home {...homeProps} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <Home {...homeProps} />
    </div>
  );
};

export default Dashboard;
