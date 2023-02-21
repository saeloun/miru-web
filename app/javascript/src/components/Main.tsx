import React, { useEffect } from "react";

import { Navigate, Routes, Route } from "react-router-dom";

import { registerIntercepts, setAuthHeaders } from "apis/axios";
import { Roles } from "constants/index";
import { AUTH_ROUTES } from "constants/routes";
import { useAuthState, useAuthDispatch } from "context/auth";
import {
  clearLocalStorageCredentials,
  getFromLocalStorage,
} from "utils/storage";

import Dashboard from "./Dashboard";
import EmailVerification from "./EmailVerification";
import OrganizationSetup from "./OrganizationSetup";

const Main = (props: Iprops) => {
  // @ts-ignore
  const { authToken } = useAuthState();
  const authDispatch = useAuthDispatch();

  const isLoggedIn = authToken && props?.user;

  useEffect(() => {
    registerIntercepts();
    setAuthHeaders();
  }, [authDispatch, props?.user]);

  useEffect(() => {
    const previousLoginAuthEmail = getFromLocalStorage("authEmail");
    const hasDeviseUserSessionExpired = !props?.user;
    const sessionExpiredButLocalStorageCredsExist =
      hasDeviseUserSessionExpired && previousLoginAuthEmail;

    if (sessionExpiredButLocalStorageCredsExist) clearLocalStorageCredentials();
    //@ts-ignore
  }, [props?.user?.email]);

  if (isLoggedIn) {
    if (props?.confirmedUser) {
      //@ts-ignore
      if (Boolean(props?.user?.current_workspace_id) == false) {
        return (
          <Routes>
            <Route element={<OrganizationSetup />} path="/" />
            <Route element={<Navigate to="/" />} path="*" />
          </Routes>
        );
      }

      return <Dashboard {...props} />;
    }

    return (
      <Routes>
        <Route element={<EmailVerification />} path="/" />
        <Route element={<Navigate to="/" />} path="*" />
      </Routes>
    );
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
      <Route element={<Navigate to="/" />} path="*" />
    </Routes>
  );
};

interface Iprops {
  user: object;
  companyRole: Roles;
  company: object;
  isDesktop: boolean;
  confirmedUser: boolean;
  isAdminUser: boolean;
}

export default Main;
