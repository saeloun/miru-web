import { Roles } from "constants/index";

import React, { useEffect, useState } from "react";

import { AuthProvider } from "context/auth";
import UserContext from "context/UserContext";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Main from "./Main";

const App = props => {
  const {
    user,
    companyRole,
    confirmedUser,
    googleOauthSuccess,
    avatarUrl,
    calendarEnabled,
    calendarConnected,
  } = props;
  const isAdminUser = [Roles.ADMIN, Roles.OWNER].includes(companyRole);

  const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth > 1023);
  const [selectedTab, setSelectedTab] = useState(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const [company, setCompany] = useState(props.company);

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
    <div data-component="App" data-testid="app-loaded">
      <UserContext.Provider
        value={{
          isAdminUser,
          calendarEnabled,
          calendarConnected,
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
          company,
          setCompany,
        }}
      >
        <AuthProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 5000,
                style: {
                  background: '#fff',
                  color: '#1D1A31',
                  border: '1px solid #E1E6EC',
                  borderRadius: '0.375rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                },
                success: {
                  iconTheme: {
                    primary: '#5B34EA',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#E04646',
                    secondary: '#fff',
                  },
                },
              }}
            />
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
    </div>
  );
};

export default App;
