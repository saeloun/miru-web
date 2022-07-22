import React, { Fragment, useEffect } from "react";

import { Roles, TOASTER_DURATION } from "constants/index";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import UserContext from "context/UserContext";

import { setAuthHeaders, registerIntercepts } from "apis/axios";

import Main from "./Main";

const App = (props) => {
  const { user, companyRole } = props;
  const isAdminUser = [Roles.ADMIN, Roles.OWNER].includes(companyRole);

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  return (
    <Fragment>
      <UserContext.Provider value={{ isAdminUser, user, companyRole }}>
        <BrowserRouter>
          <ToastContainer autoClose={TOASTER_DURATION} />
          <Main {...props} isAdminUser={isAdminUser} />
        </BrowserRouter>
      </UserContext.Provider>
    </Fragment>
  );
};

export default App;
