import React, { useState, useEffect } from "react";

import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import { Roles, TOASTER_DURATION } from "constants/index";
import UserContext from "context/UserContext";

import Main from "./Main";
import Navbar from "./Navbar";
import Header from "./Navbar/Mobile/Header";
import Navigation from "./Navbar/Mobile/Navigation";

const App = props => {
  const { user, companyRole } = props;
  const isAdminUser = [Roles.ADMIN, Roles.OWNER].includes(companyRole);
  const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth > 650);
  const [selectedTab, setSelectedTab] = useState<string>("Time Tracking");

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  window.addEventListener("resize", () =>
    setIsDesktop(window.innerWidth > 650)
  );

  window.removeEventListener("resize", () =>
    setIsDesktop(window.innerWidth > 650)
  );

  const getView = () => {
    if (isDesktop) {
      return (
        <div className="absolute inset-0 flex h-full w-full">
          <Navbar isAdminUser={isAdminUser} user={user} />
          <Main {...props} isAdminUser={isAdminUser} />
        </div>
      );
    }

    return (
      <div className="flex h-full w-full flex-col">
        <Header selectedTab={selectedTab} />
        <Main {...props} isAdminUser={isAdminUser} />
        <Navigation isAdminUser={isAdminUser} setSelectedTab={setSelectedTab} />
      </div>
    );
  };

  return (
    <UserContext.Provider value={{ isAdminUser, user, companyRole }}>
      <BrowserRouter>
        <ToastContainer autoClose={TOASTER_DURATION} />
        {getView()}
      </BrowserRouter>
    </UserContext.Provider>
  );
};

export default App;
