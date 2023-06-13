import React, { useEffect, useState } from "react";

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

  const handleOverlayVisibility = (isOverlayVisible: boolean) => {
    const overlayEl = document.getElementById("overlay");
    const overlayClasses = "fixed inset-0 z-60 bg-black bg-opacity-50".split(
      " "
    );
    if (overlayEl) {
      if (isOverlayVisible) {
        overlayEl.classList.add(...overlayClasses);
      } else {
        overlayEl.classList.remove(...overlayClasses);
      }
    }
  };

  useEffect(() => {
    handleOverlayVisibility(false);
  }, []);

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
        handleOverlayVisibility,
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
          <div id="overlay" />
        </BrowserRouter>
      </AuthProvider>
    </UserContext.Provider>
  );
};

export default App;
