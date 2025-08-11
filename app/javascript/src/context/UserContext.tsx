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
  setCurrentAvatarUrl: value => {}, //eslint-disable-line
  companyRole: "", //current company user role
  confirmedUser: "",
  isDesktop: false,
  handleOverlayVisibility: (isOverlayVisible: boolean) => {}, //eslint-disable-line
  selectedTab: null,
  googleOauthSuccess: false,
  setSelectedTab: value => {}, //eslint-disable-line
  company: null,
  setCompany: value => {}, //eslint-disable-line
  calendarEnabled: false,
  calendarConnected: false,
});

export const useUserContext = () => useContext(UserContext);

export default UserContext;
