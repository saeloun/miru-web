import React from "react";

import { getAdminOptions, getEmployeeOptions } from "./utils";

const Options = ({ isAdminUser }) => (
  <ul className="mt-8">
    {isAdminUser ? getAdminOptions() : getEmployeeOptions()}
  </ul>
);
export default Options;
