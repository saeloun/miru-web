import { createContext, useContext } from "react";
import type { Company } from "../types/company";

const UserContext = createContext({
  isAdminUser: false,
  isSuperAdmin: false,
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
    is_super_admin: false,
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
  company: null as Company | null,
  setCompany: value => {},
  calendarEnabled: false,
  calendarConnected: false,
  loading: false,
  authResolution: "unknown",
});

export const useUserContext = () => useContext(UserContext);

export default UserContext;
