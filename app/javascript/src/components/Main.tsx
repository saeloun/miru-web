import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Cookies from "js-cookie";

import { useAuthState, useAuthDispatch } from "context/auth";
import { useUserContext } from "context/UserContext";

import AppRouter from "./Routes/AppRouter";

interface MainProps {
  user?: {
    current_workspace_id?: string;
    email?: string;
  };
  companyRole?: string;
  company?: object;
  confirmedUser?: boolean;
  isDesktop?: boolean;
  isAdminUser?: boolean;
  googleOauthSuccess?: boolean;
}

const Main: React.FC<MainProps> = props => {
  const authDispatch = useAuthDispatch();
  const location = useLocation();
  const { isLoggedIn } = useAuthState();
  const { user, authResolution } = useUserContext();

  // Save last visited page for unauthenticated users
  useEffect(() => {
    if (!isLoggedIn && user) {
      Cookies.set("lastVisitedPage", location.pathname, {
        expires: 7,
        sameSite: "lax",
        secure: window.location.protocol === "https:",
      });
    }
  }, [isLoggedIn, user, location.pathname]);

  useEffect(() => {
    if (user && user.email && !isLoggedIn) {
      // User is authenticated via Rails session
      authDispatch({
        type: "LOGIN",
        payload: {
          token: null,
          email: user.email,
        },
      });
    } else if (!user && isLoggedIn && authResolution === "unauthenticated") {
      // User is no longer authenticated, log out
      authDispatch({
        type: "LOGOUT",
      });
    }
  }, [user, isLoggedIn, authDispatch, authResolution]);

  return <AppRouter {...props} user={user || props.user} />;
};

export default Main;
