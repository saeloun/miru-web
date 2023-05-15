import React, { useState } from "react";

import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Roles } from "constants/index";
import { AuthProvider } from "context/auth";
import UserContext from "context/UserContext";

import Main from "./Main";

const App = props => {
  const { user, companyRole, confirmedUser, googleOauthSuccess } = props;
  const isAdminUser = [Roles.ADMIN, Roles.OWNER].includes(companyRole);
  const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth > 1023);
  const [selectedTab, setSelectedTab] = useState(null);

  return (
    <UserContext.Provider
      value={{
        isAdminUser,
        user,
        companyRole,
        confirmedUser,
        googleOauthSuccess,
        isDesktop,
        selectedTab,
        setSelectedTab,
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <ToastContainer />
          <Main
            {...props}
            googleOauthSuccess={googleOauthSuccess}
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
