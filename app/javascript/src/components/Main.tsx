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
    if (!isLoggedIn && user) {
      Cookies.set("lastVisitedPage", location.pathname, { expires: 7 });
    }
  }, [isLoggedIn, user, location.pathname]);

  // Update auth context when user data is available
  useEffect(() => {
    if (user?.token && user?.email && !isLoggedIn) {
      authDispatch({
        type: "LOGIN",
        payload: {
          token: user.token,
          email: user.email,
        },
      });
    }
  }, [user, isLoggedIn, authDispatch]);

  return <AppRouter {...props} />;
};

export default Main;
