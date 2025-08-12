import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

import { useAuthState, useAuthDispatch } from "context/auth";
import { useUserContext } from "context/UserContext";
import { loginGoogleAuth } from "utils/googleOauthLogin";

import AppRouter from "./Routes/AppRouter";

interface MainProps {
  user?: {
    current_workspace_id?: string;
    email?: string;
    token?: string;
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
  const { user } = useUserContext();
  const navigate = useNavigate();

  // Handle Google OAuth success
  useEffect(() => {
    if (!isLoggedIn && props?.googleOauthSuccess) {
      loginGoogleAuth(user?.token, user?.email, authDispatch, navigate);
    }
  }, [isLoggedIn, props?.googleOauthSuccess, user, authDispatch, navigate]);

  // Save last visited page for unauthenticated users
  useEffect(() => {
    if (!isLoggedIn) {
      Cookies.set("lastVisitedPage", location.pathname, { expires: 7 });
    }
  }, [isLoggedIn, location.pathname]);

  // Handle server-side authentication (e.g., system tests)
  useEffect(() => {
    if (!isLoggedIn && props?.user?.email) {
      authDispatch({
        type: "LOGIN",
        payload: {
          token: props.user.token || "system-test-token",
          email: props.user.email,
        },
      });
    }
  }, [props?.user, isLoggedIn, authDispatch]);

  return <AppRouter {...props} />;
};

export default Main;
