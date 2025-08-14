import { createContext, useContext } from "react";

// Context Creation
export const ListContext = createContext({
  teamList: [],
  setModalState: (modalName, user = {}) => {},
  modal: "",
  setTeamList: (value: any[]) => {},
});

// Custom Hooks
export const useList = () => useContext(ListContext);
