import { Roles } from "constants/index";

import React, { useEffect, useState } from "react";

import { AuthProvider } from "context/auth";
import UserContext from "context/UserContext";
import { Toaster } from "sonner";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./ui/theme-provider";
import "@fontsource-variable/inter";

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
      <ThemeProvider defaultTheme="system" storageKey="miru-ui-theme">
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
                duration={5000}
                richColors
                toastOptions={{
                  classNames: {
                    toast: "bg-background text-foreground border border-border rounded-md shadow-sm",
                    title: "text-sm font-medium",
                    description: "text-xs text-muted-foreground",
                    success: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
                    error: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
                    warning: "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800",
                    info: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
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
      </ThemeProvider>
    </div>
  );
};

export default App;
