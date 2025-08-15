import { Roles } from "constants/index";
import React, { useEffect, useState } from "react";

import { AuthProvider } from "context/auth";
import UserContext from "context/UserContext";
import { ThemeProvider } from "../contexts/ThemeContext";
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
      // Check if we're on an authentication page (sign in, sign up, forgot password, etc.)
      const authPaths = [
        "/user/sign_in",
        "/user/sign_up",
        "/user/password/new",
        "/user/password/edit",
        "/email_verification",
      ];
      const currentPath = window.location.pathname;
      const isAuthPage = authPaths.some(path => currentPath.startsWith(path));

      // Don't fetch user data if we're on an auth page
      if (isAuthPage) {
        setUserData({
          user: null,
          company: null,
          companyRole: null,
          loading: false,
        });

        return;
      }

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
        } else if (response.status === 401) {
          // User not authenticated, redirect to login
          window.location.href = "/user/sign_in";

          return;
        } else {
          // Other error
          setUserData({
            user: null,
            company: null,
            companyRole: null,
            loading: false,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user details:", error);
        // On network error, redirect to login
        window.location.href = "/user/sign_in";
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

  // Show loading spinner while fetching user data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-miru-han-purple-1000 mx-auto mb-4"></div>
          <div className="text-miru-dark-purple-1000">Loading...</div>
        </div>
      </div>
    );
  }

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
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            richColors
            duration={5000}
            position="top-right"
            toastOptions={{
              classNames: {
                toast:
                  "bg-white dark:bg-gray-800 text-miru-dark-purple-1000 dark:text-gray-100 border border-miru-gray-1000 dark:border-gray-700 rounded-md shadow-sm",
                title: "text-sm font-medium",
                description: "text-xs text-miru-dark-purple-400 dark:text-gray-400",
                success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300",
                error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300",
                warning: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300",
                info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",
              },
            }}
          />
          <AppWithUserData {...props} />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
    <div id="overlay" />
  </div>
);

export default App;
