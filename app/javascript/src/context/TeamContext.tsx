import { createContext, useContext } from "react";

// Context Creation
export const ListContext = createContext({
  teamList: [],
  setModalState: (modalName, user = {}) => {}, // eslint-disable-line
  modal: "",
  setRefreshList: (value: boolean) => {}, // eslint-disable-line
});

// Custom Hooks
export const useList = () => useContext(ListContext);
