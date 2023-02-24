import React from "react";

import { Roles } from "constants/index";

import Dashboard from "./Dashboard";

const Main = (props: Iprops) => <Dashboard {...props} />;
interface Iprops {
  user: object;
  companyRole: Roles;
  company: object;
  isDesktop: boolean;
  isAdminUser: boolean;
}

export default Main;
