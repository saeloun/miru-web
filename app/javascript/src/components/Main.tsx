import { Paths, Roles } from "constants/index";
import { AUTH_ROUTES, PUBLIC_ROUTES } from "constants/routes";

import React, { useEffect } from "react";

import { useAuthState, useAuthDispatch } from "context/auth";
import { useUserContext } from "context/UserContext";
import Cookies from "js-cookie";
import {
  Navigate,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { loginGoogleAuth } from "utils/googleOauthLogin";
import {
  clearCredentialsFromLocalStorage,
  getValueFromLocalStorage,
} from "utils/storage";

import Dashboard from "./Dashboard";
import OrganizationSetup from "./OrganizationSetup";
import SignUpSuccess from "./OrganizationSetup/SignUpSuccess";

const Main = (props: Iprops) => {
  const authDispatch = useAuthDispatch();
  const location = useLocation();
  //@ts-expect-error is used to allow authToken value on empty object
  const { isLoggedIn } = useAuthState();
  const { user } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn && props?.googleOauthSuccess) {
      loginGoogleAuth(user?.token, user?.email, authDispatch, navigate);
    }

    if (!isLoggedIn) {
      Cookies.set("lastVisitedPage", location.pathname, { expires: 7 });
    }
  }, [isLoggedIn, props?.googleOauthSuccess]);

  useEffect(() => {
    const previousLoginAuthEmail = getValueFromLocalStorage("authEmail");
    const hasDeviseUserSessionExpired = !props?.user;
    const sessionExpiredButLocalStorageCredsExist =
      hasDeviseUserSessionExpired && previousLoginAuthEmail;

    if (sessionExpiredButLocalStorageCredsExist) {
      clearCredentialsFromLocalStorage();
    }
  }, [props?.user]);

  if (isLoggedIn) {
    const current_workspace_id = props?.user?.current_workspace_id;
    const confirmedUser = props?.confirmedUser;
    if (confirmedUser) {
      if (!current_workspace_id) {
        return (
          <Routes>
            <Route element={<OrganizationSetup />} path="/" />
            <Route element={<SignUpSuccess />} path={Paths.SIGNUP_SUCCESS} />
            <Route element={<Navigate to="/" />} path="*" />
          </Routes>
        );
      }

      return (
        <Routes>
          {PUBLIC_ROUTES.map(route => (
            <Route
              element={<route.component />}
              key={route.path}
              path={route.path}
            />
          ))}
          {AUTH_ROUTES.map(route => (
            <Route
              element={<Dashboard {...props} />}
              key={route.path}
              path={route.path}
            />
          ))}
          <Route element={<Dashboard {...props} />} path="*" />
        </Routes>
      );
    }
  }

  return (
    <Routes>
      {AUTH_ROUTES.map(route => (
        <Route
          element={<route.component />}
          key={route.path}
          path={route.path}
        />
      ))}
      {PUBLIC_ROUTES.map(route => (
        <Route
          element={<route.component />}
          key={route.path}
          path={route.path}
        />
      ))}
      <Route element={<Navigate to="/" />} path="*" />
    </Routes>
  );
};
interface Iprops {
  user: {
    current_workspace_id: string;
  };
  companyRole: Roles;
  company: object;
  confirmedUser: boolean;
  isDesktop: boolean;
  isAdminUser: boolean;
  googleOauthSuccess: boolean;
}

export default Main;
