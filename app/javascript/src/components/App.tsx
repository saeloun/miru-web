import { Roles } from "constants/index";
import React, { useEffect, useState } from "react";

import { AuthProvider } from "context/auth";
import UserContext from "context/UserContext";
import { Toaster } from "sonner";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/inter";

import Main from "./Main";
import { useUserDetails } from "../hooks/useUserDetails";

const AppWithUserData = props => {
  const { user: fetchedUser, company, companyRole, loading } = useUserDetails();

  // Use fetched user data or props/localStorage as fallback
  const storedUser = localStorage.getItem("user");
  const storedCompanyRole = localStorage.getItem("company_role");
  const storedCompany = localStorage.getItem("company");

  const user =
    fetchedUser || props.user || (storedUser ? JSON.parse(storedUser) : null);

  const actualCompanyRole =
    companyRole || props.companyRole || storedCompanyRole || user?.company_role;

  const actualCompany =
    company ||
    props.company ||
    (storedCompany ? JSON.parse(storedCompany) : null);

  const confirmedUser = props.confirmedUser ?? user?.confirmed;
  const googleOauthSuccess = props.googleOauthSuccess;
  const avatarUrl = props.avatarUrl || user?.avatar_url;
  const calendarEnabled = props.calendarEnabled ?? user?.calendar_enabled;
  const calendarConnected = props.calendarConnected ?? user?.calendar_connected;

  const isAdminUser = [Roles.ADMIN, Roles.OWNER].includes(actualCompanyRole);

  const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth > 1023);
  const [selectedTab, setSelectedTab] = useState(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const [companyState, setCompany] = useState(actualCompany);

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

  // Update states when fetched data changes
  useEffect(() => {
    if (fetchedUser) {
      setCurrentAvatarUrl(fetchedUser.avatar_url);
    }

    if (company) {
      setCompany(company);
    }
  }, [fetchedUser, company]);

  return (
    <UserContext.Provider
      value={{
        isAdminUser,
        calendarEnabled,
        calendarConnected,
        user,
        avatarUrl: currentAvatarUrl,
        setCurrentAvatarUrl,
        companyRole: actualCompanyRole,
        confirmedUser,
        googleOauthSuccess,
        isDesktop,
        handleOverlayVisibility,
        selectedTab,
        setSelectedTab,
        company: companyState,
        setCompany,
        loading, // Add loading state to context
      }}
    >
      <Main
        {...props}
        company={actualCompany}
        companyRole={actualCompanyRole}
        googleOauthSuccess={googleOauthSuccess}
        isAdminUser={isAdminUser}
        isDesktop={isDesktop}
        setIsDesktop={setIsDesktop}
        user={user}
      />
    </UserContext.Provider>
  );
};

const App = props => (
  <div data-component="App" data-testid="app-loaded">
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          richColors
          duration={5000}
          position="top-right"
          toastOptions={{
            classNames: {
              toast:
                "bg-white text-miru-dark-purple-1000 border border-miru-gray-1000 rounded-md shadow-sm",
              title: "text-sm font-medium",
              description: "text-xs text-miru-dark-purple-400",
              success: "bg-green-50 border-green-200 text-green-800",
              error: "bg-red-50 border-red-200 text-red-800",
              warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
              info: "bg-blue-50 border-blue-200 text-blue-800",
            },
          }}
        />
        <AppWithUserData {...props} />
      </AuthProvider>
    </BrowserRouter>
    <div id="overlay" />
  </div>
);

export default App;
