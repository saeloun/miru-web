import React, { useState } from "react";

import Navbar from "../Navbar";
import Header from "../Navbar/Mobile/Header";
import Navigation from "../Navbar/Mobile/Navigation";
import Home from "./Home";

const Dashboard = props => {
  const { isAdminUser, user, isDesktop, setIsDesktop } = props;
  const [selectedTab, setSelectedTab] = useState<string>(null);

  window.addEventListener("resize", () =>
    setIsDesktop(window.innerWidth > 1023)
  );

  window.removeEventListener("resize", () =>
    setIsDesktop(window.innerWidth > 1023)
  );

  if (isDesktop) {
    return (
      <div className="absolute inset-0 flex h-full w-full">
        <Navbar isAdminUser={isAdminUser} user={user} />
        <Home {...props} isAdminUser={isAdminUser} isDesktop={isDesktop} />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <Header selectedTab={selectedTab} />
      <Home {...props} isAdminUser={isAdminUser} isDesktop={isDesktop} />
      <Navigation isAdminUser={isAdminUser} setSelectedTab={setSelectedTab} />
    </div>
  );
};

export default Dashboard;
