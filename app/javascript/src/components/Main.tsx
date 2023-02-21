import React, { useEffect } from "react";

import { Navigate, Routes, Route } from "react-router-dom";

import { Roles } from "constants/index";
import { AUTH_ROUTES} from "constants/routes";
import { useAuthState, useAuthDispatch } from "context/auth";
import Dashboard from "./Dashboard";
import { registerIntercepts, setAuthHeaders } from "apis/axios";
import { clearLocalStorageCredentials, getFromLocalStorage } from "utils/storage";
import OrganizationSetup from "./OrganizationSetup";
import EmailVerification from "./EmailVerification";

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
    if(props?.confirmedUser){
      //@ts-ignore
      if(Boolean(props?.user?.current_workspace_id) == false){
        return (
          <Routes>
            <Route path="/" element={<OrganizationSetup />}/>
            <Route path="*" element={<Navigate to ="/" />}/>
          </Routes>
        )
      } else {
        return <Dashboard {...props}/>
      }
    } else {
      return (
        <Routes>
          <Route path="/" element={<EmailVerification />}/>
          <Route path="*" element={<Navigate to ="/" />}/>
        </Routes>
      )
    }
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
  confirmedUser: boolean
  isAdminUser: boolean;
}

export default Main;
