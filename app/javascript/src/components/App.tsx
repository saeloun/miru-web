import React, { useEffect, useState } from "react";

import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import { Roles, TOASTER_DURATION, Paths } from "constants/index";
import { miruApp } from "constants/miruApp";
import { AuthProvider } from "context/auth";
import UserContext from "context/UserContext";

import Main from "./Main";

const App = props => {
  const { user, companyRole, confirmedUser } = props;
  const isAdminUser = [Roles.ADMIN, Roles.OWNER].includes(companyRole);
  const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth > 1023);
  const [selectedTab, setSelectedTab] = useState(null);
  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    if (document.location.pathname == Paths.AUTHORIZATION) {
      document.location.assign(miruApp.url);
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        isAdminUser,
        user,
        companyRole,
        isDesktop,
        selectedTab,
        setSelectedTab,
        confirmedUser,
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <ToastContainer autoClose={TOASTER_DURATION} />
          <Main
            {...props}
            isAdminUser={isAdminUser}
            isDesktop={isDesktop}
            setIsDesktop={setIsDesktop}
            user={user}
          />
        </BrowserRouter>
      </AuthProvider>
    </UserContext.Provider>
  );
};

export default App;
