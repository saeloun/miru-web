import React, { useEffect } from "react";

import { Roles } from "constants/index";
import { useAuthDispatch } from "context/auth";

import Dashboard from "./Dashboard";

const Main = (props: Iprops) => {
  const authDispatch = useAuthDispatch();
  //@ts-expect-error for authDispatch initial values
  const { token, email } = props.user;

  useEffect(() => {
    handleAuthLogin();
  }, [email, token]);

  const handleAuthLogin = async () => {
    //@ts-expect-error for authDispatch initial values
    authDispatch({
      type: "LOGIN",
      payload: {
        token,
        email,
      },
    });
  };

  return <Dashboard {...props} />;
};
interface Iprops {
  user: object;
  companyRole: Roles;
  company: object;
  isDesktop: boolean;
  isAdminUser: boolean;
}

export default Main;
