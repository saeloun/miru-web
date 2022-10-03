import { createContext, useContext } from "react";

// Context Creation
export const ListContext = createContext(({
  teamList: [],
  departments: [],
  setModalState: (modalName, user = {}) => { }, // eslint-disable-line
  modal: ""
}));

// Custom Hooks
export const useList = () => useContext(ListContext);
