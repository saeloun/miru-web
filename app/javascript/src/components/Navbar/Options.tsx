import React from "react";

import {
  getAdminOptions,
  getBookKeeperOptions,
  getEmployeeOptions,
} from "./utils";

const Options = ({ isAdminUser, isBookKeeper }) => (
  <ul className="mt-8">
    {isAdminUser
      ? getAdminOptions()
      : isBookKeeper
      ? getBookKeeperOptions()
      : getEmployeeOptions()}
  </ul>
);
export default Options;
