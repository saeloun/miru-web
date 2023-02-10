import React, { useEffect } from "react";

import { Navigate, Routes, Route } from "react-router-dom";

import { Roles } from "constants/index";
import { AUTH_ROUTES} from "constants/routes";
import { useAuthState, useAuthDispatch } from "context/auth";
import Dashboard from "./Dashboard";
import { registerIntercepts, setAuthHeaders } from "apis/axios";
import { clearLocalStorageCredentials, getFromLocalStorage } from "utils/storage";

const Main = (props :Iprops) => {
  // @ts-ignore
  const { authToken } = useAuthState();
  const authDispatch = useAuthDispatch();

  const isLoggedIn = authToken && props?.user

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

  if(isLoggedIn){
    return <Dashboard {...props}/>
  }

  return (
    <Routes>
      {AUTH_ROUTES.map((route) => (
        <Route
          element={ <route.component /> }
          path={route.path}
          key={route.path}
        />
      ))}
      <Route path="*" element={<Navigate to ="/" />}/>
    </Routes>
  )
}

interface Iprops {
  user: object;
  companyRole: Roles;
  company: object;
  isDesktop: boolean;
}

export default Main;
