import { createContext, useContext } from "react";

import { CompensationDetailsState } from "components/Profile/Context/CompensationDetailsState";
import { EmploymentDetailsState } from "components/Profile/Context/EmploymentDetailsState";
import { PersonalDetailsState } from "components/Profile/Context/PersonalDetailsState";
// Context Creation

export const ProfileContext = createContext({
  personalDetails: PersonalDetailsState,
  employmentDetails: EmploymentDetailsState,
  documentDetails: {},
  deviceDetails: {},
  compensationDetails: CompensationDetailsState,
  reimburstmentDetails: {},
  updateDetails: (key, payload) => {}, //eslint-disable-line
  isCalledFromSettings: false,
  setIsCalledFromSettings: val => {}, //eslint-disable-line
  isCalledFromTeam: false,
  setIsCalledFromTeam: val => {}, //eslint-disable-line
});

// Custom Hooks
export const useProfileContext = () => useContext(ProfileContext);
