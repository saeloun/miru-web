import React from "react";
import Header from "./Layout/Header";
import OutletWrapper from "./Layout/OutletWrapper";
import SideNav from "./Layout/SideNav";

const RouteConfig = () => (
  <div>
    <Header />
    <div className="flex mt-6 mb-10">
      <SideNav />
      <OutletWrapper />
    </div>
  </div>
);

export default RouteConfig;
