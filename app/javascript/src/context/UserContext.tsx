import { createContext, useContext } from "react";

const UserContext = createContext(({
  isAdminUser: false,
  user: {},
  companyRole: "" //current company user role
}));

export const useUserContext = () => useContext(UserContext);

export default UserContext;
