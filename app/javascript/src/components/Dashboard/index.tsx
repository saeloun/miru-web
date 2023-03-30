import React from "react";

import Home from "./Home";

import Navbar from "../Navbar";

const Dashboard = props => {
  const { isAdminUser, user, isDesktop, setIsDesktop, companyRole } = props;

  window.addEventListener("resize", () =>
    setIsDesktop(window.innerWidth > 1023)
  );

  window.removeEventListener("resize", () =>
    setIsDesktop(window.innerWidth > 1023)
  );

  if (isDesktop) {
    return (
      <div className="absolute inset-0 flex h-full w-full">
        <Navbar companyRole={companyRole} user={user} />
        <Home {...props} isAdminUser={isAdminUser} isDesktop={isDesktop} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <Home {...props} isAdminUser={isAdminUser} isDesktop={isDesktop} />
    </div>
  );
};

export default Dashboard;
