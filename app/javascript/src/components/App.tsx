import React, { useState } from "react";

import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Roles } from "constants/index";
import { AuthProvider } from "context/auth";
import UserContext from "context/UserContext";

import Main from "./Main";

const App = props => {
  const { user, companyRole, confirmedUser, googleOauthSuccess, avatarUrl } =
    props;
  const isAdminUser = [Roles.ADMIN, Roles.OWNER].includes(companyRole);
  const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth > 1023);
  const [selectedTab, setSelectedTab] = useState(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);

  return (
    <UserContext.Provider
      value={{
        isAdminUser,
        user,
        avatarUrl: currentAvatarUrl,
        setCurrentAvatarUrl,
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
