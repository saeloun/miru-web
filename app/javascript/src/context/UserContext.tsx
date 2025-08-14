import { createContext, useContext } from "react";

const UserContext = createContext({
  isAdminUser: false,
  user: {
    current_workspace_id: null,
    email: "",
    token: "",
    first_name: "",
    last_name: "",
    id: "",
  },
  avatarUrl: "",
  setCurrentAvatarUrl: value => {},
  companyRole: "", //current company user role
  confirmedUser: "",
  isDesktop: false,
  handleOverlayVisibility: (isOverlayVisible: boolean) => {},
  selectedTab: null,
  googleOauthSuccess: false,
  setSelectedTab: value => {},
  company: null,
  setCompany: value => {},
  calendarEnabled: false,
  calendarConnected: false,
  loading: false,
});

export const useUserContext = () => useContext(UserContext);

export default UserContext;
