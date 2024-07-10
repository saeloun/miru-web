import React from "react";

import { Outlet } from "react-router-dom";

const OutletWrapper = () => (
  <div className="flex w-full flex-col">
    <Outlet />
  </div>
);

export default OutletWrapper;
