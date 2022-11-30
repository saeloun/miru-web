import { createContext, useContext } from "react";

// Context Creation
export const TeamDetailsContext = createContext({
  details: {
    personalDetails: {},
    employmentDetails: [],
    documentDetails: {},
    deviceDetails: {},
    compensationDetails: {},
    reimburstmentDetails: {},
  },
  updateDetails: (key, payload) => {}, //eslint-disable-line
});

// Custom Hooks
export const useTeamDetails = () => useContext(TeamDetailsContext);
