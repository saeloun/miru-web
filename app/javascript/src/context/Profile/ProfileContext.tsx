import { createContext, useContext } from "react";

import { EmploymentDetailsState } from "components/Profile/Context/EmploymentDetailsState";
import { PersonalDetailsState } from "components/Profile/Context/PersonalDetailsState";
// Context Creation

export const ProfileContext = createContext({
  personalDetails: PersonalDetailsState,
  employmentDetails: EmploymentDetailsState,
  documentDetails: {},
  deviceDetails: {},
  reimburstmentDetails: {},
  updateDetails: (key, payload) => {},
  isCalledFromSettings: false,
  setIsCalledFromSettings: val => {},
  isCalledFromTeam: false,
  setIsCalledFromTeam: val => {},
});

// Custom Hooks
export const useProfileContext = () => useContext(ProfileContext);
