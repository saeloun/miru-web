import { Roles } from "../constants/index";
import React, { useEffect, useState } from "react";
import UserContext from "../context/UserContext";
import Loader from "../common/Loader/index";
import Main from "./Main";

const AUTH_PATH_PREFIXES = [
  "/user/sign_in",
  "/login",
  "/signup",
  "/password/new",
  "/password/edit",
  "/email_confirmation",
];

const isAuthPagePath = (pathname: string) =>
  AUTH_PATH_PREFIXES.some(path => pathname.startsWith(path));

const AppWithUserData = (props: any) => {
  const isAuthPage = isAuthPagePath(window.location.pathname);
  const [userData, setUserData] = useState({
    user: null,
    company: null,
    companyRole: null,
    loading: !isAuthPage,
  });

  // Fetch user details from _me endpoint on mount
  useEffect(() => {
    const fetchUserDetails = async () => {
      // Skip fetching if we're on an auth page
      if (isAuthPage) {
        // On auth pages, don't fetch user data
        setUserData({
          user: null,
          company: null,
          companyRole: null,
          loading: false,
        });

        return;
      }

      try {
        const response = await fetch("/api/v1/users/_me", {
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
          // Not authenticated - just set loading to false
          setUserData({
            user: null,
            company: null,
            companyRole: null,
            loading: false,
          });
        }
      } catch (error) {
        setUserData({
          user: null,
          company: null,
          companyRole: null,
          loading: false,
        });
      }
    };

    fetchUserDetails();
  }, []);

  const { user, company, companyRole, loading } = userData;

  const confirmedUser = user?.confirmed;
  const googleOauthSuccess = props.googleOauthSuccess;
  const avatarUrl = user?.avatar_url;
  const calendarEnabled = user?.calendar_enabled;
  const calendarConnected = user?.calendar_connected;

  const isAdminUser = [Roles.ADMIN, Roles.OWNER].includes(companyRole);

  const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth > 1023);
  const [selectedTab, setSelectedTab] = useState(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const [companyState, setCompany] = useState(company);
  const resolvedCompany = companyState || company;

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
  }, [user]);

  useEffect(() => {
    if (company) {
      setCompany(company);
    }
  }, [company]);

  // Show loading spinner while fetching user data
  if (loading) {
    return <Loader className="h-screen" />;
  }

  return (
    <UserContext.Provider
      value={{
        user,
        avatarUrl: currentAvatarUrl,
        setCurrentAvatarUrl,
        companyRole,
        isAdminUser,
        calendarEnabled,
        calendarConnected,
        confirmedUser,
        googleOauthSuccess,
        isDesktop,
        handleOverlayVisibility,
        selectedTab,
        setSelectedTab,
        company: resolvedCompany,
        setCompany,
        loading,
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

export default AppWithUserData;
