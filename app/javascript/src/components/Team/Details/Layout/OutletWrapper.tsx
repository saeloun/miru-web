import React from "react";
import { Outlet } from "react-router-dom";

const OutletWrapper = () => (
  <div>
    <Outlet />
  </div>
);

export default OutletWrapper;
