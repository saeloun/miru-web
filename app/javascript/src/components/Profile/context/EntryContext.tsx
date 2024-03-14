import { createContext, useContext } from "react";

import { CompensationDetailsState } from "./CompensationDetailsState";
import { EmploymentDetailsState } from "./EmploymentDetailsState";
import { PersonalDetailsState } from "./PersonalDetailsState";

const EntryContext = createContext({
  profileSettings: PersonalDetailsState,
  employmentDetails: EmploymentDetailsState,
  compensationDetails: CompensationDetailsState,
  organizationSettings: {},
  bankAccDetails: {},
  paymentSettings: {},
  billing: {},
  setUserState: (key, value) => {}, //eslint-disable-line
});

export const useProfile = () => useContext(EntryContext);

export default EntryContext;
