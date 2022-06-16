import { createContext, useContext } from "react";

const UserContext = createContext(({
  isAdminUser: false
}));

export const useUserContext = () => useContext(UserContext);

export default UserContext;
