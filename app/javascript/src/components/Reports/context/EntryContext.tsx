import React, { createContext, useContext } from "react";

const EntryContext = createContext(({
  entries: [],
}));

export const useEntry = () => useContext(EntryContext);

export default EntryContext;
