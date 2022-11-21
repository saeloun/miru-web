import React, { Fragment, useEffect } from "react";

import { Roles, TOASTER_DURATION } from "constants/index";

import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import UserContext from "context/UserContext";

import Main from "./Main";
import Navbar from "./Navbar";

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
          <div className="flex w-full h-full absolute inset-0">
            <Navbar isAdminUser={isAdminUser} user={user} />
            <Main {...props} isAdminUser={isAdminUser} />
          </div>
        </BrowserRouter>
      </UserContext.Provider>
    </Fragment>
  );
};

export default App;
