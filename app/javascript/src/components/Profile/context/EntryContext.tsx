import { createContext, useContext } from "react";

import { EmploymentDetailsState } from "./EmploymentDetailsState";
import { PersonalDetailsState } from "./PersonalDetailsState";

const EntryContext = createContext({
  profileSettings: PersonalDetailsState,
  employmentDetails: EmploymentDetailsState,
  organizationSettings: {},
  bankAccDetails: {},
  paymentSettings: {},
  billing: {},
  setUserState: (key, value) => {}, //eslint-disable-line
});

export const useProfile = () => useContext(EntryContext);

export default EntryContext;
