import React from "react";

import { getNavOptions } from "./utils";

const Options = ({ companyRole }) => (
  <ul className="mt-2 xl:mt-8">{getNavOptions(companyRole)}</ul>
);
export default Options;
