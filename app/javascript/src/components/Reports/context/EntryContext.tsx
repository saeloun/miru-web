import { createContext, useContext } from "react";

const EntryContext = createContext(({
  entries: [],
  selectedFilter: {
    dateRange: { label: "All", value: "" },
    clients: [],
    teamMember: [],
    status: [],
    groupBy: { label: "None", value: "" }
  },
  filterOptions: {
    clients: [],
    teamMembers: []
  },
  filterCounter: 0,
  handleRemoveSingleFilter: (key, value) => { }, //eslint-disable-line
}));

export const useEntry = () => useContext(EntryContext);

export default EntryContext;
