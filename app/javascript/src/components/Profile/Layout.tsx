import React from "react";
import { BrowserRouter } from "react-router-dom";
import Header from "./Header";
import RouteConfig from "./RouteConfig";
import SideNav from "./SubNav";

const Layout = ({isAdmin}) => {
  console.log(isAdmin);
  return (
    <React.Fragment>
      <BrowserRouter>
          <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
            <h2 className="header__title">Settings</h2>
          </div>
          <div className="flex mt-5 mb-10">
            <SideNav />
            <div className="flex flex-col w-4/5">
              <Header
                title={'Bank Account Details'}
                subTitle={'Settings to receive payment from your employer'}
              />
              <div className="py-10 px-20 mt-4 bg-miru-gray-100 h-screen">
                <RouteConfig />
              </div>
            </div>
          </div>
      </BrowserRouter>
    </React.Fragment>
  )
};

export default Layout;
