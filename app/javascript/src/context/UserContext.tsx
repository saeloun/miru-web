import { createContext, useContext } from "react";

const UserContext = createContext({
  isAdminUser: false,
  locale: "en-US",
  setLocale: value => {},
  user: {
    current_workspace_id: null,
    email: "",
    token: "",
    first_name: "",
    last_name: "",
    id: "",
    locale: "en-US",
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
  authResolution: "unknown",
});

export const useUserContext = () => useContext(UserContext);

export default UserContext;
