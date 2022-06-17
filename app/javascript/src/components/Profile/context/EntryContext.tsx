import { createContext, useContext } from "react";

const EntryContext = createContext(({
  profileSettings: {},
  organizationSettings: {},
  bankAccDetails: {},
  paymentSettings: {},
  billing: {},
  setUserState: (key, value) => { }  //eslint-disable-line
}));

export const useEntry = () => useContext(EntryContext);

export default EntryContext;
