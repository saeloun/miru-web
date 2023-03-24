import React, { useEffect } from "react";

import { Navigate, Routes, Route } from "react-router-dom";

import { Paths, Roles } from "constants/index";
import { AUTH_ROUTES } from "constants/routes";
import { useAuthState } from "context/auth";
import {
  clearCredentialsFromLocalStorage,
  getValueFromLocalStorage,
} from "utils/storage";

import Dashboard from "./Dashboard";
import OrganizationSetup from "./OrganizationSetup";
import SignUpSuccess from "./OrganizationSetup/SignUpSuccess";

const Main = (props: Iprops) => {
  //@ts-expect-error is used to allow authToken value on empty object
  const { isLoggedIn } = useAuthState();

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
  user: {
    current_workspace_id: string;
  };
  companyRole: Roles;
  company: object;
  confirmedUser: boolean;
  isDesktop: boolean;
  isAdminUser: boolean;
}

export default Main;
