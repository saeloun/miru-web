/* eslint-disable no-unused-vars */

import { createContext, useContext } from "react";

const UserContext = createContext({
  isAdminUser: false,
  user: {},
  companyRole: "", //current company user role
  isDesktop: false,
  selectedTab: null,
  setSelectedTab: value => {}, //eslint-disable-line
});

export const useUserContext = () => useContext(UserContext);

export default UserContext;
