import React, { useEffect } from "react";

import { Navigate, Routes, Route } from "react-router-dom";

import { Roles } from "constants/index";
import { AUTH_ROUTES } from "constants/routes";
import { useAuthState } from "context/auth";
import {
  clearCredentialsFromLocalStorage,
  getValueFromLocalStorage,
} from "utils/storage";

import Dashboard from "./Dashboard";
import OrganizationSetup from "./OrganizationSetup";

const Main = (props: Iprops) => {
  //@ts-expect-error is used to allow authToken value on empty object
  const { authToken, authEmail } = useAuthState();

  const isLoggedIn = authToken && authEmail;

  const { confirmedUser, companyRole } = props;

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
    if (confirmedUser) {
      if (!companyRole) {
        return (
          <Routes>
            <Route element={<OrganizationSetup />} path="/" />
            <Route element={<Navigate to="/" />} path="*" />
          </Routes>
        );
      }

      return <Dashboard {...props} />;
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
      <Route element={<Navigate to="/" />} path="*" />
    </Routes>
  );
};
interface Iprops {
  user: object;
  companyRole: Roles;
  company: object;
  confirmedUser: boolean;
  isDesktop: boolean;
  isAdminUser: boolean;
}

export default Main;
