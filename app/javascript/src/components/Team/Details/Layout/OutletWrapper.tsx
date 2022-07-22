import React from "react";
import { Outlet } from "react-router-dom";

const OutletWrapper = () => (
  <div className="flex flex-col w-full">
    <Outlet />
  </div>
);

export default OutletWrapper;
