import { Roles } from "constants/index";
import React, { useEffect, useState } from "react";

import { AuthProvider } from "context/auth";
import UserContext from "context/UserContext";
import { Toaster } from "sonner";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/inter";

import Main from "./Main";

const AppWithUserData = props => {
  const [userData, setUserData] = useState({
    user: null,
    company: null,
    companyRole: null,
    loading: true,
  });

  // Fetch user details from _me endpoint on mount
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch("/internal_api/v1/users/_me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN":
              document
                .querySelector('[name="csrf-token"]')
                ?.getAttribute("content") || "",
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUserData({
            user: data.user,
            company: data.company,
            companyRole: data.company_role,
            loading: false,
          });
        } else {
          // No user session
          setUserData({
            user: null,
            company: null,
            companyRole: null,
            loading: false,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user details:", error);
        setUserData({
          user: null,
          company: null,
          companyRole: null,
          loading: false,
        });
      }
    };

    // Always fetch fresh user data from server
    fetchUserDetails();
  }, []);

  const { user, company, companyRole, loading } = userData;

  const confirmedUser = props.confirmedUser ?? user?.confirmed;
  const googleOauthSuccess = props.googleOauthSuccess;
  const avatarUrl = props.avatarUrl || user?.avatar_url;
  const calendarEnabled = props.calendarEnabled ?? user?.calendar_enabled;
  const calendarConnected = props.calendarConnected ?? user?.calendar_connected;

  const isAdminUser = [Roles.ADMIN, Roles.OWNER].includes(companyRole);

  const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth > 1023);
  const [selectedTab, setSelectedTab] = useState(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const [companyState, setCompany] = useState(company);

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

  // Update states when user data changes
  useEffect(() => {
    if (user?.avatar_url) {
      setCurrentAvatarUrl(user.avatar_url);
    }

    if (company) {
      setCompany(company);
    }
  }, [user, company]);

  return (
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
        company: companyState,
        setCompany,
        loading, // Add loading state to context
      }}
    >
      <Main
        {...props}
        company={company}
        companyRole={companyRole}
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
