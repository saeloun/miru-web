import React, { useEffect } from "react";

import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import { Roles, TOASTER_DURATION, Paths } from "constants/index";
import { miruApp } from "constants/miruApp";
import UserContext from "context/UserContext";

import DisplayView from "./DisplayView";

const App = props => {
  const { user, companyRole } = props;
  const isAdminUser = [Roles.ADMIN, Roles.OWNER].includes(companyRole);

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    if (document.location.pathname == Paths.AUTHORIZATION) {
      document.location.assign(miruApp.url);
    }
  }, []);

  return (
    <UserContext.Provider value={{ isAdminUser, user, companyRole }}>
      <BrowserRouter>
        <ToastContainer autoClose={TOASTER_DURATION} />
        <DisplayView {...props} isAdminUser={isAdminUser} user={user} />
      </BrowserRouter>
    </UserContext.Provider>
  );
};

export default App;
