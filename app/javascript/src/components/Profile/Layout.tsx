import React from "react";
import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";

import { TOASTER_DURATION } from "constants/index";
import RouteConfig from "./RouteConfig";
import SideNav from "./SubNav";

const Layout = ({ isAdmin, company, userDetails }) => {

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  return (
    <React.Fragment>
      <BrowserRouter>
        <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
          <h2 className="header__title">Settings</h2>
        </div>
        <div className="flex mt-5 mb-10">
          <SideNav
            isAdmin={isAdmin}
            company={company}
            firstName={userDetails.firstName}
            lastName={userDetails.lastName}
            email={userDetails.email}
          />
          <RouteConfig />
        </div>
        <ToastContainer autoClose={TOASTER_DURATION} />
      </BrowserRouter>
    </React.Fragment>
  );
};

export default Layout;
