import React from "react";
import { BrowserRouter } from "react-router-dom";
import RouteConfig from "./RouteConfig";
import SideNav from "./SubNav";

const Layout = ({isAdmin, userDetails}) => {
  return (
    <React.Fragment>
      <BrowserRouter>
          <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
            <h2 className="header__title">Settings</h2>
          </div>
          <div className="flex mt-5 mb-10">
            <SideNav
              isAdmin={isAdmin}
              firstName={userDetails.firstName}
              lastName={userDetails.lastName}
              email={userDetails.email}
            />
            <RouteConfig />
          </div>
      </BrowserRouter>
    </React.Fragment>
  )
};

export default Layout;
