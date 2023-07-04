import { createContext, useContext } from "react";

import { EmploymentDetailsState } from "components/Team/Details/EmploymentDetails/EmploymentDetailsState";
import { PersonalDetailsState } from "components/Team/Details/PersonalDetails/PersonalDetailsState";
// Context Creation

export const TeamDetailsContext = createContext({
  details: {
    personalDetails: PersonalDetailsState,
    employmentDetails: EmploymentDetailsState,
    documentDetails: {},
    deviceDetails: {},
    compensationDetails: {},
    reimburstmentDetails: {},
  },
  updateDetails: (key, payload) => {}, //eslint-disable-line
});

// Custom Hooks
export const useTeamDetails = () => useContext(TeamDetailsContext);
