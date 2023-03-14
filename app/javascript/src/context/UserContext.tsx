/* eslint-disable no-unused-vars */

import { createContext, useContext } from "react";

const UserContext = createContext({
  isAdminUser: false,
  user: {
    current_workspace_id: null,
    email: "",
    token: "",
    first_name: "",
    last_name: "",
  },
  companyRole: "", //current company user role
  confirmedUser: "",
  isDesktop: false,
  selectedTab: null,
  setSelectedTab: value => {}, //eslint-disable-line
});

export const useUserContext = () => useContext(UserContext);

export default UserContext;
