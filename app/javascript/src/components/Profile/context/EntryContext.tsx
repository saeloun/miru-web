import { createContext, useContext } from "react";

import { PersonalDetailsState } from "./PersonalDetailsState";

const EntryContext = createContext({
  profileSettings: PersonalDetailsState,
  organizationSettings: {},
  bankAccDetails: {},
  paymentSettings: {},
  billing: {},
  setUserState: (key, value) => {}, //eslint-disable-line
});

export const useProfile = () => useContext(EntryContext);

export default EntryContext;
