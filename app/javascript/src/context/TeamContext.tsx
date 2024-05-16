import { createContext, useContext } from "react";

// Context Creation
export const ListContext = createContext({
  teamList: [],
  setModalState: (modalName, user = {}) => {}, // eslint-disable-line
  modal: "",
  setTeamList: (value: any[]) => {}, // eslint-disable-line
});

// Custom Hooks
export const useList = () => useContext(ListContext);
